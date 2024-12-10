# gorm

## 安装

```shell
go get -u gorm.io/gorm
go get -u gorm.io/driver/sqlite
```

## 快速入门

```go
package main

import (
  "gorm.io/gorm"
  "gorm.io/driver/sqlite"
)

type Product struct {
  gorm.Model
  Code  string
  Price uint
}

func main() {
  db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
  if err != nil {
    panic("failed to connect database")
  }
  

  // 迁移 schema
  db.AutoMigrate(&Product{})

  // Create
  db.Create(&Product{Code: "D42", Price: 100})

  // Read
  var product Product
  db.First(&product, 1) // 根据整型主键查找
  db.First(&product, "code = ?", "D42") // 查找 code 字段值为 D42 的记录

  // Update - 将 product 的 price 更新为 200
  db.Model(&product).Update("Price", 200)
  // Update - 更新多个字段
  db.Model(&product).Updates(Product{Price: 200, Code: "F42"}) // 仅更新非零值字段
  db.Model(&product).Updates(map[string]interface{}{"Price": 200, "Code": "F42"})

  // Delete - 删除 product
  db.Delete(&product, 1)
}


```

# 模型定义



GORM 通过将 Go 结构体（Go structs） 映射到数据库表来简化数据库交互。 了解如何在GORM中定义模型，是充分利用GORM全部功能的基础。

## 模型定义

模型是使用普通结构体定义的。 这些结构体可以包含具有基本Go类型、指针或这些类型的别名，甚至是自定义类型（只需要实现 `database/sql` 包中的[Scanner](https://pkg.go.dev/database/sql/?tab=doc#Scanner)和[Valuer](https://pkg.go.dev/database/sql/driver#Valuer)接口）。

考虑以下 `user` 模型的示例：

```go
type User struct {
  ID           uint           // Standard field for the primary key
  Name         string         // 一个常规字符串字段
  Email        *string        // 一个指向字符串的指针, allowing for null values
  Age          uint8          // 一个未签名的8位整数
  Birthday     *time.Time     // A pointer to time.Time, can be null
  MemberNumber sql.NullString // Uses sql.NullString to handle nullable strings
  ActivatedAt  sql.NullTime   // Uses sql.NullTime for nullable time fields
  CreatedAt    time.Time      // 创建时间（由GORM自动管理）
  UpdatedAt    time.Time      // 最后一次更新时间（由GORM自动管理）
}
```

在此模型中：

- 具体数字类型如 `uint`、`string`和 `uint8` 直接使用。
- 指向 `*string` 和 `*time.Time` 类型的指针表示可空字段。
- 来自 `database/sql` 包的 `sql.NullString` 和 `sql.NullTime` 用于具有更多控制的可空字段。
- `CreatedAt` 和 `UpdatedAt` 是特殊字段，当记录被创建或更新时，GORM 会自动向内填充当前时间。

除了 GORM 中模型声明的基本特性外，强调下通过 serializer 标签支持序列化也很重要。 此功能增强了数据存储和检索的灵活性，特别是对于需要自定义序列化逻辑的字段。详细说明请参见 [Serializer](https://gorm.io/zh_CN/docs/serializer.html)。

### 约定

1. **主键**：GORM 使用一个名为`ID` 的字段作为每个模型的默认主键。
2. **表名**：默认情况下，GORM 将结构体名称转换为 `snake_case` （蛇形命名）并为表名加上复数形式。 例如，一个 `User` 结构体在数据库中的表名变为 `users` 。
3. **列名**：GORM 自动将结构体字段名称转换为 `snake_case` 作为数据库中的列名。
4. **时间戳字段**：GORM使用字段 `CreatedAt` 和 `UpdatedAt` 来自动跟踪记录的创建和更新时间。

遵循这些约定可以大大减少您需要编写的配置或代码量。 但是，GORM也具有灵活性，允许您根据自己的需求自定义这些设置。 您可以在GORM的[约定](https://gorm.io/zh_CN/docs/conventions.html)文档中了解更多关于自定义这些约定的信息。

### `gorm.Model`

GORM提供了一个预定义的结构体，名为`gorm.Model`，其中包含常用字段：

```go
// gorm.Model 的定义
type Model struct {
  ID        uint           `gorm:"primaryKey"`
  CreatedAt time.Time
  UpdatedAt time.Time
  DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

- **将其嵌入在您的结构体中**: 您可以直接在您的结构体中嵌入 `gorm.Model` ，以便自动包含这些字段。 这对于在不同模型之间保持一致性并利用GORM内置的约定非常有用，请参考[嵌入结构](https://gorm.io/zh_CN/docs/models.html#embedded_struct)。
- **包含的字段**：
  - `ID` ：每个记录的唯一标识符（主键）。
  - `CreatedAt` ：在创建记录时自动设置为当前时间。
  - `UpdatedAt`：每当记录更新时，自动更新为当前时间。
  - `DeletedAt`：用于软删除（将记录标记为已删除，而实际上并未从数据库中删除）。

## 高级选项

### 字段级权限控制

可导出的字段在使用 GORM 进行 CRUD 时拥有全部的权限，此外，GORM 允许您用标签控制字段级别的权限。这样您就可以让一个字段的权限是只读、只写、只创建、只更新或者被忽略

> **注意：** 使用 GORM Migrator 创建表时，不会创建被忽略的字段

```go
type User struct {
  Name string `gorm:"<-:create"` // 允许读和创建
  Name string `gorm:"<-:update"` // 允许读和更新
  Name string `gorm:"<-"`        // 允许读和写（创建和更新）
  Name string `gorm:"<-:false"`  // 允许读，禁止写
  Name string `gorm:"->"`        // 只读（除非有自定义配置，否则禁止写）
  Name string `gorm:"->;<-:create"` // 允许读和写
  Name string `gorm:"->:false;<-:create"` // 仅创建（禁止从 db 读）
  Name string `gorm:"-"`  // 通过 struct 读写会忽略该字段
  Name string `gorm:"-:all"`        // 通过 struct 读写、迁移会忽略该字段
  Name string `gorm:"-:migration"`  // 通过 struct 迁移会忽略该字段
}
```

### 创建/更新时间追踪（纳秒、毫秒、秒、Time）

GORM 约定使用 `CreatedAt`、`UpdatedAt` 追踪创建/更新时间。如果您定义了这种字段，GORM 在创建、更新时会自动填充 [当前时间](https://gorm.io/zh_CN/docs/gorm_config.html#now_func)

要使用不同名称的字段，您可以配置 `autoCreateTime`、`autoUpdateTime` 标签。

如果您想要保存 UNIX（毫/纳）秒时间戳，而不是 time，您只需简单地将 `time.Time` 修改为 `int` 即可

```go
type User struct {
  CreatedAt time.Time // 在创建时，如果该字段值为零值，则使用当前时间填充
  UpdatedAt int       // 在创建时该字段值为零值或者在更新时，使用当前时间戳秒数填充
  Updated   int64 `gorm:"autoUpdateTime:nano"` // 使用时间戳纳秒数填充更新时间
  Updated   int64 `gorm:"autoUpdateTime:milli"` // 使用时间戳毫秒数填充更新时间
  Created   int64 `gorm:"autoCreateTime"`      // 使用时间戳秒数填充创建时间
}
```

### 嵌入结构体

对于匿名字段，GORM 会将其字段包含在父结构体中，例如：

```go
type User struct {
  gorm.Model
  Name string
}
// 等效于
type User struct {
  ID        uint           `gorm:"primaryKey"`
  CreatedAt time.Time
  UpdatedAt time.Time
  DeletedAt gorm.DeletedAt `gorm:"index"`
  Name string
}
```

对于正常的结构体字段，你也可以通过标签 `embedded` 将其嵌入，例如：

```go
type Author struct {
    Name  string
    Email string
}

type Blog struct {
  ID      int
  Author  Author `gorm:"embedded"`
  Upvotes int32
}
// 等效于
type Blog struct {
  ID    int64
  Name  string
  Email string
  Upvotes  int32
}
```

并且，您可以使用标签 `embeddedPrefix` 来为 db 中的字段名添加前缀，例如：

```
type Blog struct {
  ID      int
  Author  Author `gorm:"embedded;embeddedPrefix:author_"`
  Upvotes int32
}
// 等效于
type Blog struct {
  ID          int64
  AuthorName string
  AuthorEmail string
  Upvotes     int32
}
```

### 字段标签

Tags are optional to use when declaring models, GORM supports the following tags: Tags are case insensitive, however `camelCase` is preferred. If multiple tags are used they should be separated by a semicolon (`;`). Characters that have special meaning to the parser can be escaped with a backslash (`\`) allowing them to be used as parameter values.

| 标签名                 | 说明                                                         |
| :--------------------- | :----------------------------------------------------------- |
| column                 | 指定 db 列名                                                 |
| type                   | 列数据类型，推荐使用兼容性好的通用类型，例如：所有数据库都支持 bool、int、uint、float、string、time、bytes 并且可以和其他标签一起使用，例如：`not null`、`size`, `autoIncrement`… 像 `varbinary(8)` 这样指定数据库数据类型也是支持的。在使用指定数据库数据类型时，它需要是完整的数据库数据类型，如：`MEDIUMINT UNSIGNED not NULL AUTO_INCREMENT` |
| serializer             | 指定将数据序列化或反序列化到数据库中的序列化器, 例如: `serializer:json/gob/unixtime` |
| size                   | 定义列数据类型的大小或长度，例如 `size: 256`                 |
| primaryKey             | 将列定义为主键                                               |
| unique                 | 将列定义为唯一键                                             |
| default                | 定义列的默认值                                               |
| precision              | 指定列的精度                                                 |
| scale                  | 指定列大小                                                   |
| not null               | 指定列为 NOT NULL                                            |
| autoIncrement          | 指定列为自动增长                                             |
| autoIncrementIncrement | 自动步长，控制连续记录之间的间隔                             |
| embedded               | 嵌套字段                                                     |
| embeddedPrefix         | 嵌入字段的列名前缀                                           |
| autoCreateTime         | 创建时追踪当前时间，对于 `int` 字段，它会追踪时间戳秒数，您可以使用 `nano`/`milli` 来追踪纳秒、毫秒时间戳，例如：`autoCreateTime:nano` |
| autoUpdateTime         | 创建/更新时追踪当前时间，对于 `int` 字段，它会追踪时间戳秒数，您可以使用 `nano`/`milli` 来追踪纳秒、毫秒时间戳，例如：`autoUpdateTime:milli` |
| index                  | 根据参数创建索引，多个字段使用相同的名称则创建复合索引，查看 [索引](https://gorm.io/zh_CN/docs/indexes.html) 获取详情 |
| uniqueIndex            | 与 `index` 相同，但创建的是唯一索引                          |
| check                  | 创建检查约束，例如 `check:age > 13`，查看 [约束](https://gorm.io/zh_CN/docs/constraints.html) 获取详情 |
| <-                     | 设置字段写入的权限， `<-:create` 只创建、`<-:update` 只更新、`<-:false` 无写入权限、`<-` 创建和更新权限 |
| ->                     | 设置字段读的权限，`->:false` 无读权限                        |
| -                      | 忽略该字段，`-` 表示无读写，`-:migration` 表示无迁移权限，`-:all` 表示无读写迁移权限 |
| comment                | 迁移时为字段添加注释                                         |

### 关联标签

GORM 允许通过标签为关联配置外键、约束、many2many 表

# 连接到数据库



GORM 官方支持的数据库类型有：MySQL, PostgreSQL, SQLite, SQL Server 和 TiDB

## MySQL

```
import (
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
)

func main() {
  // 参考 https://github.com/go-sql-driver/mysql#dsn-data-source-name 获取详情
  dsn := "user:pass@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
  db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
}
```

> **注意：**想要正确的处理 `time.Time` ，您需要带上 `parseTime` 参数， ([更多参数](https://github.com/go-sql-driver/mysql#parameters)) 要支持完整的 UTF-8 编码，您需要将 `charset=utf8` 更改为 `charset=utf8mb4` 查看 [此文章](https://mathiasbynens.be/notes/mysql-utf8mb4) 获取详情

MySQL 驱动程序提供了 [一些高级配置](https://github.com/go-gorm/mysql) 可以在初始化过程中使用，例如：

```
db, err := gorm.Open(mysql.New(mysql.Config{
  DSN: "gorm:gorm@tcp(127.0.0.1:3306)/gorm?charset=utf8&parseTime=True&loc=Local", // DSN data source name
  DefaultStringSize: 256, // string 类型字段的默认长度
  DisableDatetimePrecision: true, // 禁用 datetime 精度，MySQL 5.6 之前的数据库不支持
  DontSupportRenameIndex: true, // 重命名索引时采用删除并新建的方式，MySQL 5.7 之前的数据库和 MariaDB 不支持重命名索引
  DontSupportRenameColumn: true, // 用 `change` 重命名列，MySQL 8 之前的数据库和 MariaDB 不支持重命名列
  SkipInitializeWithVersion: false, // 根据当前 MySQL 版本自动配置
}), &gorm.Config{})
```

### 自定义驱动

GORM 允许通过 `DriverName` 选项自定义 MySQL 驱动，例如：

```
import (
  _ "example.com/my_mysql_driver"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
)

db, err := gorm.Open(mysql.New(mysql.Config{
  DriverName: "my_mysql_driver",
  DSN: "gorm:gorm@tcp(localhost:9910)/gorm?charset=utf8&parseTime=True&loc=Local", // data source name, 详情参考：https://github.com/go-sql-driver/mysql#dsn-data-source-name
}), &gorm.Config{})
```

### 现有的数据库连接

GORM 允许通过一个现有的数据库连接来初始化 `*gorm.DB`

```
import (
  "database/sql"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
)

sqlDB, err := sql.Open("mysql", "mydb_dsn")
gormDB, err := gorm.Open(mysql.New(mysql.Config{
  Conn: sqlDB,
}), &gorm.Config{})
```

## PostgreSQL

```
import (
  "gorm.io/driver/postgres"
  "gorm.io/gorm"
)

dsn := "host=localhost user=gorm password=gorm dbname=gorm port=9920 sslmode=disable TimeZone=Asia/Shanghai"
db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
```

我们使用 [pgx](https://github.com/jackc/pgx) 作为 postgres 的 database/sql 驱动，默认情况下，它会启用 prepared statement 缓存，你可以这样禁用它：

```
// https://github.com/go-gorm/postgres
db, err := gorm.Open(postgres.New(postgres.Config{
  DSN: "user=gorm password=gorm dbname=gorm port=9920 sslmode=disable TimeZone=Asia/Shanghai",
  PreferSimpleProtocol: true, // disables implicit prepared statement usage
}), &gorm.Config{})
```

### 自定义驱动

GORM 允许通过 `DriverName` 选项自定义 PostgreSQL 驱动，例如：

```
import (
  _ "github.com/GoogleCloudPlatform/cloudsql-proxy/proxy/dialers/postgres"
  "gorm.io/gorm"
)

db, err := gorm.Open(postgres.New(postgres.Config{
  DriverName: "cloudsqlpostgres",
  DSN: "host=project:region:instance user=postgres dbname=postgres password=password sslmode=disable",
})
```

### 现有的数据库连接

GORM 允许通过一个现有的数据库连接来初始化 `*gorm.DB`

```
import (
  "database/sql"
  "gorm.io/driver/postgres"
  "gorm.io/gorm"
)

sqlDB, err := sql.Open("pgx", "mydb_dsn")
gormDB, err := gorm.Open(postgres.New(postgres.Config{
  Conn: sqlDB,
}), &gorm.Config{})
```

## SQLite

```go
import (
  "gorm.io/driver/sqlite" // Sqlite driver based on CGO
  // "github.com/glebarez/sqlite" // Pure go SQLite driver, checkout https://github.com/glebarez/sqlite for details
  "gorm.io/gorm"
)

// github.com/mattn/go-sqlite3
db, err := gorm.Open(sqlite.Open("gorm.db"), &gorm.Config{})
```

## SQL Server

```
import (
  "gorm.io/driver/sqlserver"
  "gorm.io/gorm"
)

// github.com/denisenkom/go-mssqldb
dsn := "sqlserver://gorm:LoremIpsum86@localhost:9930?database=gorm"
db, err := gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
```

## TiDB

TiDB 兼容 MySQL 协议。 因此你可以按照 [MySQL](https://gorm.io/zh_CN/docs/connecting_to_the_database.html#mysql) 一节来创建与 TiDB 的连接。

在使用 TiDB 时有一些值得注意的内容：

- 您可以在结构体中使用 `gorm:"primaryKey;default:auto_random()"` 标签从而调用 TiDB 的 [`AUTO_RANDOM`](https://docs.pingcap.com/zh/tidb/stable/auto-random) 功能。
- TiDB supported [`SAVEPOINT`](https://docs.pingcap.com/tidb/stable/sql-statement-savepoint) from `v6.2.0`, please notice the version of TiDB when you use this feature.
- TiDB supported [`FOREIGN KEY`](https://docs.pingcap.com/tidb/dev/foreign-key) from `v6.6.0`, please notice the version of TiDB when you use this feature.

```go
import (
  "fmt"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
)

type Product struct {
  ID    uint `gorm:"primaryKey;default:auto_random()"`
  Code  string
  Price uint
}

func main() {
  db, err := gorm.Open(mysql.Open("root:@tcp(127.0.0.1:4000)/test"), &gorm.Config{})
  if err != nil {
    panic("failed to connect database")
  }

  db.AutoMigrate(&Product{})

  insertProduct := &Product{Code: "D42", Price: 100}

  db.Create(insertProduct)
  fmt.Printf("insert ID: %d, Code: %s, Price: %d\n",
    insertProduct.ID, insertProduct.Code, insertProduct.Price)

  readProduct := &Product{}
  db.First(&readProduct, "code = ?", "D42") // find product with code D42

  fmt.Printf("read ID: %d, Code: %s, Price: %d\n",
    readProduct.ID, readProduct.Code, readProduct.Price)
}
```

## Clickhouse

https://github.com/go-gorm/clickhouse

```go
import (
  "gorm.io/driver/clickhouse"
  "gorm.io/gorm"
)

func main() {
 dsn := "clickhouse://gorm:gorm@localhost:9942/gorm?dial_timeout=10s&read_timeout=20s"
  db, err := gorm.Open(clickhouse.Open(dsn), &gorm.Config{})

  // 自动迁移 (这是GORM自动创建表的一种方式--译者注)
  db.AutoMigrate(&User{})
  // 设置表选项
  db.Set("gorm:table_options", "ENGINE=Distributed(cluster, default, hits)").AutoMigrate(&User{})

  // 插入
  db.Create(&user)

  // 查询
  db.Find(&user, "id = ?", 10)

  // 批量插入
  var users = []User{user1, user2, user3}
  db.Create(&users)
  // ...
}
```

## 连接池

GORM 使用 [database/sql](https://pkg.go.dev/database/sql) 来维护连接池

```go
sqlDB, err := db.DB()

// SetMaxIdleConns sets the maximum number of connections in the idle connection pool.
sqlDB.SetMaxIdleConns(10)

// SetMaxOpenConns sets the maximum number of open connections to the database.
sqlDB.SetMaxOpenConns(100)

// SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
sqlDB.SetConnMaxLifetime(time.Hour)
```

# 创建



## 创建记录

```
user := User{Name: "Jinzhu", Age: 18, Birthday: time.Now()}

result := db.Create(&user) // 通过数据的指针来创建

user.ID             // 返回插入数据的主键
result.Error        // 返回 error
result.RowsAffected // 返回插入记录的条数
```

我们还可以使用 `Create()` 创建多项记录：

```
users := []*User{
    {Name: "Jinzhu", Age: 18, Birthday: time.Now()},
    {Name: "Jackson", Age: 19, Birthday: time.Now()},
}

result := db.Create(users) // pass a slice to insert multiple row

result.Error        // returns error
result.RowsAffected // returns inserted records count
```

> **NOTE** 你无法向 ‘create’ 传递结构体，所以你应该传入数据的指针.

## 用指定的字段创建记录

创建记录并为指定字段赋值。

```
db.Select("Name", "Age", "CreatedAt").Create(&user)
// INSERT INTO `users` (`name`,`age`,`created_at`) VALUES ("jinzhu", 18, "2020-07-04 11:05:21.775")
```

创建记录并忽略传递给 ‘Omit’ 的字段值

```
db.Omit("Name", "Age", "CreatedAt").Create(&user)
// INSERT INTO `users` (`birthday`,`updated_at`) VALUES ("2020-01-01 00:00:00.000", "2020-07-04 11:05:21.775")
```

## 批量插入

要高效地插入大量记录，请将切片传递给`Create`方法。 GORM 将生成一条 SQL 来插入所有数据，以返回所有主键值，并触发 `Hook` 方法。 当这些记录可以被分割成多个批次时，GORM会开启一个事务</0>来处理它们。

```
var users = []User{{Name: "jinzhu1"}, {Name: "jinzhu2"}, {Name: "jinzhu3"}}
db.Create(&users)

for _, user := range users {
  user.ID // 1,2,3
}
```

你可以通过`db.CreateInBatches`方法来指定批量插入的批次大小

```
var users = []User{{Name: "jinzhu_1"}, ...., {Name: "jinzhu_10000"}}

// batch size 100
db.CreateInBatches(users, 100)
```

[Upsert](https://gorm.io/zh_CN/docs/create.html#upsert) 和 [Create With Associations](https://gorm.io/zh_CN/docs/create.html#create_with_associations)同样支持批量插入

> **注意** 使用`CreateBatchSize` 选项初始化GORM实例后，此后进行创建& 关联操作时所有的`INSERT`行为都会遵循初始化时的配置。

```
db, err := gorm.Open(sqlite.Open("gorm.db"), &gorm.Config{
  CreateBatchSize: 1000,
})

db := db.Session(&gorm.Session{CreateBatchSize: 1000})

users = [5000]User{{Name: "jinzhu", Pets: []Pet{pet1, pet2, pet3}}...}

db.Create(&users)
// INSERT INTO users xxx (5 batches)
// INSERT INTO pets xxx (15 batches)
```

## 创建钩子

GROM允许用户通过实现这些接口 `BeforeSave`, `BeforeCreate`, `AfterSave`, `AfterCreate`来自定义钩子。 这些钩子方法会在创建一条记录时被调用，关于钩子的生命周期请参阅[Hooks](https://gorm.io/zh_CN/docs/hooks.html)。

```
func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
  u.UUID = uuid.New()

    if u.Role == "admin" {
        return errors.New("invalid role")
    }
    return
}
```

如果你想跳过`Hooks`方法，可以使用`SkipHooks`会话模式，例子如下

```
DB.Session(&gorm.Session{SkipHooks: true}).Create(&user)

DB.Session(&gorm.Session{SkipHooks: true}).Create(&users)

DB.Session(&gorm.Session{SkipHooks: true}).CreateInBatches(users, 100)
```

## 根据 Map 创建

GORM支持通过 `map[string]interface{}` 与 `[]map[string]interface{}{}`来创建记录。

```
db.Model(&User{}).Create(map[string]interface{}{
  "Name": "jinzhu", "Age": 18,
})

// batch insert from `[]map[string]interface{}{}`
db.Model(&User{}).Create([]map[string]interface{}{
  {"Name": "jinzhu_1", "Age": 18},
  {"Name": "jinzhu_2", "Age": 20},
})
```

> **注意**当使用map来创建时，钩子方法不会执行，关联不会被保存且不会回写主键。

## 使用 SQL 表达式、Context Valuer 创建记录

GORM允许使用SQL表达式来插入数据，有两种方法可以达成该目的，使用`map[string]interface{}` 或者 [Customized Data Types](https://gorm.io/zh_CN/docs/data_types.html#gorm_valuer_interface)， 示例如下：

```
// Create from map
db.Model(User{}).Create(map[string]interface{}{
  "Name": "jinzhu",
  "Location": clause.Expr{SQL: "ST_PointFromText(?)", Vars: []interface{}{"POINT(100 100)"}},
})
// INSERT INTO `users` (`name`,`location`) VALUES ("jinzhu",ST_PointFromText("POINT(100 100)"));

// Create from customized data type
type Location struct {
    X, Y int
}

// Scan implements the sql.Scanner interface
func (loc *Location) Scan(v interface{}) error {
  // Scan a value into struct from database driver
}

func (loc Location) GormDataType() string {
  return "geometry"
}

func (loc Location) GormValue(ctx context.Context, db *gorm.DB) clause.Expr {
  return clause.Expr{
    SQL:  "ST_PointFromText(?)",
    Vars: []interface{}{fmt.Sprintf("POINT(%d %d)", loc.X, loc.Y)},
  }
}

type User struct {
  Name     string
  Location Location
}

db.Create(&User{
  Name:     "jinzhu",
  Location: Location{X: 100, Y: 100},
})
// INSERT INTO `users` (`name`,`location`) VALUES ("jinzhu",ST_PointFromText("POINT(100 100)"))
```

## 高级选项

### 关联创建

创建关联数据时，如果关联值非零，这些关联会被upsert，并且它们的`Hooks`方法也会被调用。

```
type CreditCard struct {
  gorm.Model
  Number   string
  UserID   uint
}

type User struct {
  gorm.Model
  Name       string
  CreditCard CreditCard
}

db.Create(&User{
  Name: "jinzhu",
  CreditCard: CreditCard{Number: "411111111111"}
})
// INSERT INTO `users` ...
// INSERT INTO `credit_cards` ...
```

你可以通过`Select`, `Omit`方法来跳过关联更新，示例如下：

```
db.Omit("CreditCard").Create(&user)

// skip all associations
db.Omit(clause.Associations).Create(&user)
```

### 默认值

你可以通过结构体Tag `default`来定义字段的默认值，示例如下：

```
type User struct {
  ID   int64
  Name string `gorm:"default:galeone"`
  Age  int64  `gorm:"default:18"`
}
```

这些默认值会被当作结构体字段的[零值](https://tour.golang.org/basics/12)插入到数据库中

> **注意**，当结构体的字段默认值是零值的时候比如 `0`, `''`, `false`，这些字段值将不会被保存到数据库中，你可以使用指针类型或者Scanner/Valuer来避免这种情况。

```
type User struct {
  gorm.Model
  Name string
  Age  *int           `gorm:"default:18"`
  Active sql.NullBool `gorm:"default:true"`
}
```

> **注意**，若要让字段在数据库中拥有默认值则必须使用`default`Tag来为结构体字段设置默认值。如果想要在数据库迁移的时候跳过默认值，可以使用 `default:(-)`，示例如下：

```
type User struct {
  ID        string `gorm:"default:uuid_generate_v3()"` // db func
  FirstName string
  LastName  string
  Age       uint8
  FullName  string `gorm:"->;type:GENERATED ALWAYS AS (concat(firstname,' ',lastname));default:(-);"`
}
```

> **注意** **SQLite** 不支持批量插入的时候使用默认值。 前往 [SQLite Insert stmt](https://www.sqlite.org/lang_insert.html)了解。 下面是一个使用案例：
>
> ```
> type Pet struct {
>     Name string `gorm:"default:cat"`
> }
> 
> // 在SqlLite中，这是不允许的, 所以GORM会通过构建错误的SQL来返回错误:
> // INSERT INTO `pets` (`name`) VALUES ("dog"),(DEFAULT) RETURNING `name`
> db.Create(&[]Pet{{Name: "dog"}, {}})
> ```
>
> 一个可行的替代方案是通过钩子方法来设置默认字段
>
> ```
> func (p *Pet) BeforeCreate(tx *gorm.DB) (err error) {
>     if p.Name == "" {
>         p.Name = "cat"
>     }
> }
> ```
>
> 你可以在[issues#6335](https://github.com/go-gorm/gorm/issues/6335)了解到更多有关信息。

当使用virtual/generated value时，你可能需要禁用它的创建/更新权限，前往[Field-Level Permission](https://gorm.io/zh_CN/docs/models.html#field_permission)了解字段权限。

### Upsert 及冲突

GORM为不同数据库提供了对Upsert的兼容性支持。

```go
import "gorm.io/gorm/clause"

// Do nothing on conflict
db.Clauses(clause.OnConflict{DoNothing: true}).Create(&user)

// Update columns to default value on `id` conflict
db.Clauses(clause.OnConflict{
  Columns:   []clause.Column{{Name: "id"}},
  DoUpdates: clause.Assignments(map[string]interface{}{"role": "user"}),
}).Create(&users)
// MERGE INTO "users" USING *** WHEN NOT MATCHED THEN INSERT *** WHEN MATCHED THEN UPDATE SET ***; SQL Server
// INSERT INTO `users` *** ON DUPLICATE KEY UPDATE ***; MySQL

// Use SQL expression
db.Clauses(clause.OnConflict{
  Columns:   []clause.Column{{Name: "id"}},
  DoUpdates: clause.Assignments(map[string]interface{}{"count": gorm.Expr("GREATEST(count, VALUES(count))")}),
}).Create(&users)
// INSERT INTO `users` *** ON DUPLICATE KEY UPDATE `count`=GREATEST(count, VALUES(count));

// Update columns to new value on `id` conflict
db.Clauses(clause.OnConflict{
  Columns:   []clause.Column{{Name: "id"}},
  DoUpdates: clause.AssignmentColumns([]string{"name", "age"}),
}).Create(&users)
// MERGE INTO "users" USING *** WHEN NOT MATCHED THEN INSERT *** WHEN MATCHED THEN UPDATE SET "name"="excluded"."name"; SQL Server
// INSERT INTO "users" *** ON CONFLICT ("id") DO UPDATE SET "name"="excluded"."name", "age"="excluded"."age"; PostgreSQL
// INSERT INTO `users` *** ON DUPLICATE KEY UPDATE `name`=VALUES(name),`age`=VALUES(age); MySQL

// Update all columns to new value on conflict except primary keys and those columns having default values from sql func
db.Clauses(clause.OnConflict{
  UpdateAll: true,
}).Create(&users)
// INSERT INTO "users" *** ON CONFLICT ("id") DO UPDATE SET "name"="excluded"."name", "age"="excluded"."age", ...;
// INSERT INTO `users` *** ON DUPLICATE KEY UPDATE `name`=VALUES(name),`age`=VALUES(age), ...; MySQL
```

# 查询



## 检索单个对象

GORM 提供了 `First`、`Take`、`Last` 方法，以便从数据库中检索单个对象。当查询数据库时它添加了 `LIMIT 1` 条件，且没有找到记录时，它会返回 `ErrRecordNotFound` 错误

```
// 获取第一条记录（主键升序）
db.First(&user)
// SELECT * FROM users ORDER BY id LIMIT 1;

// 获取一条记录，没有指定排序字段
db.Take(&user)
// SELECT * FROM users LIMIT 1;

// 获取最后一条记录（主键降序）
db.Last(&user)
// SELECT * FROM users ORDER BY id DESC LIMIT 1;

result := db.First(&user)
result.RowsAffected // 返回找到的记录数
result.Error        // returns error or nil

// 检查 ErrRecordNotFound 错误
errors.Is(result.Error, gorm.ErrRecordNotFound)
```

> 如果你想避免`ErrRecordNotFound`错误，你可以使用`Find`，比如`db.Limit(1).Find(&user)`，`Find`方法可以接受struct和slice的数据。

> 对单个对象使用`Find`而不带limit，`db.Find(&user)`将会查询整个表并且只返回第一个对象，只是性能不高并且不确定的。

`First` and `Last` 方法会按主键排序找到第一条记录和最后一条记录 (分别)。 只有在目标 struct 是指针或者通过 `db.Model()` 指定 model 时，该方法才有效。 此外，如果相关 model 没有定义主键，那么将按 model 的第一个字段进行排序。 例如：

```
var user User
var users []User

// works because destination struct is passed in
db.First(&user)
// SELECT * FROM `users` ORDER BY `users`.`id` LIMIT 1

// works because model is specified using `db.Model()`
result := map[string]interface{}{}
db.Model(&User{}).First(&result)
// SELECT * FROM `users` ORDER BY `users`.`id` LIMIT 1

// doesn't work
result := map[string]interface{}{}
db.Table("users").First(&result)

// works with Take
result := map[string]interface{}{}
db.Table("users").Take(&result)

// no primary key defined, results will be ordered by first field (i.e., `Code`)
type Language struct {
  Code string
  Name string
}
db.First(&Language{})
// SELECT * FROM `languages` ORDER BY `languages`.`code` LIMIT 1
```

### 根据主键检索

如果主键是数字类型，您可以使用 [内联条件](https://gorm.io/zh_CN/docs/query.html#inline_conditions) 来检索对象。 当使用字符串时，需要额外的注意来避免SQL注入；查看 [Security](https://gorm.io/zh_CN/docs/security.html) 部分来了解详情。

```
db.First(&user, 10)
// SELECT * FROM users WHERE id = 10;

db.First(&user, "10")
// SELECT * FROM users WHERE id = 10;

db.Find(&users, []int{1,2,3})
// SELECT * FROM users WHERE id IN (1,2,3);
```

如果主键是字符串(例如像uuid)，查询将被写成如下：

```
db.First(&user, "id = ?", "1b74413f-f3b8-409f-ac47-e8c062e3472a")
// SELECT * FROM users WHERE id = "1b74413f-f3b8-409f-ac47-e8c062e3472a";
```

当目标对象有一个主键值时，将使用主键构建查询条件，例如：

```
var user = User{ID: 10}
db.First(&user)
// SELECT * FROM users WHERE id = 10;

var result User
db.Model(User{ID: 10}).First(&result)
// SELECT * FROM users WHERE id = 10;
```

> **NOTE:** 如果您使用 gorm 的特定字段类型（例如 `gorm.DeletedAt`），它将运行不同的查询来检索对象。

```
type User struct {
  ID           string `gorm:"primarykey;size:16"`
  Name         string `gorm:"size:24"`
  DeletedAt    gorm.DeletedAt `gorm:"index"`
}

var user = User{ID: 15}
db.First(&user)
//  SELECT * FROM `users` WHERE `users`.`id` = '15' AND `users`.`deleted_at` IS NULL ORDER BY `users`.`id` LIMIT 1
```

## 检索全部对象

```
// Get all records
result := db.Find(&users)
// SELECT * FROM users;

result.RowsAffected // returns found records count, equals `len(users)`
result.Error        // returns error
```

## 条件

### String 条件

```
// Get first matched record
db.Where("name = ?", "jinzhu").First(&user)
// SELECT * FROM users WHERE name = 'jinzhu' ORDER BY id LIMIT 1;

// Get all matched records
db.Where("name <> ?", "jinzhu").Find(&users)
// SELECT * FROM users WHERE name <> 'jinzhu';

// IN
db.Where("name IN ?", []string{"jinzhu", "jinzhu 2"}).Find(&users)
// SELECT * FROM users WHERE name IN ('jinzhu','jinzhu 2');

// LIKE
db.Where("name LIKE ?", "%jin%").Find(&users)
// SELECT * FROM users WHERE name LIKE '%jin%';

// AND
db.Where("name = ? AND age >= ?", "jinzhu", "22").Find(&users)
// SELECT * FROM users WHERE name = 'jinzhu' AND age >= 22;

// Time
db.Where("updated_at > ?", lastWeek).Find(&users)
// SELECT * FROM users WHERE updated_at > '2000-01-01 00:00:00';

// BETWEEN
db.Where("created_at BETWEEN ? AND ?", lastWeek, today).Find(&users)
// SELECT * FROM users WHERE created_at BETWEEN '2000-01-01 00:00:00' AND '2000-01-08 00:00:00';
```

> 如果对象设置了主键，条件查询将不会覆盖主键的值，而是用 And 连接条件。 例如：
>
> ```
> var user = User{ID: 10}
> db.Where("id = ?", 20).First(&user)
> // SELECT * FROM users WHERE id = 10 and id = 20 ORDER BY id ASC LIMIT 1
> ```
>
> 这个查询将会给出`record not found`错误 所以，在你想要使用例如 `user` 这样的变量从数据库中获取新值前，需要将例如 `id` 这样的主键设置为nil。

### Struct & Map 条件

```
// Struct
db.Where(&User{Name: "jinzhu", Age: 20}).First(&user)
// SELECT * FROM users WHERE name = "jinzhu" AND age = 20 ORDER BY id LIMIT 1;

// Map
db.Where(map[string]interface{}{"name": "jinzhu", "age": 20}).Find(&users)
// SELECT * FROM users WHERE name = "jinzhu" AND age = 20;

// Slice of primary keys
db.Where([]int64{20, 21, 22}).Find(&users)
// SELECT * FROM users WHERE id IN (20, 21, 22);
```

> **NOTE** When querying with struct, GORM will only query with non-zero fields, that means if your field’s value is `0`, `''`, `false` or other [zero values](https://tour.golang.org/basics/12), it won’t be used to build query conditions, for example:

```
db.Where(&User{Name: "jinzhu", Age: 0}).Find(&users)
// SELECT * FROM users WHERE name = "jinzhu";
```

To include zero values in the query conditions, you can use a map, which will include all key-values as query conditions, for example:

```
db.Where(map[string]interface{}{"Name": "jinzhu", "Age": 0}).Find(&users)
// SELECT * FROM users WHERE name = "jinzhu" AND age = 0;
```

For more details, see [Specify Struct search fields](https://gorm.io/zh_CN/docs/query.html#specify_search_fields).

### 指定结构体查询字段

When searching with struct, you can specify which particular values from the struct to use in the query conditions by passing in the relevant field name or the dbname to `Where()`, for example:

```
db.Where(&User{Name: "jinzhu"}, "name", "Age").Find(&users)
// SELECT * FROM users WHERE name = "jinzhu" AND age = 0;

db.Where(&User{Name: "jinzhu"}, "Age").Find(&users)
// SELECT * FROM users WHERE age = 0;
```

### 内联条件

Query conditions can be inlined into methods like `First` and `Find` in a similar way to `Where`.

```
// Get by primary key if it were a non-integer type
db.First(&user, "id = ?", "string_primary_key")
// SELECT * FROM users WHERE id = 'string_primary_key';

// Plain SQL
db.Find(&user, "name = ?", "jinzhu")
// SELECT * FROM users WHERE name = "jinzhu";

db.Find(&users, "name <> ? AND age > ?", "jinzhu", 20)
// SELECT * FROM users WHERE name <> "jinzhu" AND age > 20;

// Struct
db.Find(&users, User{Age: 20})
// SELECT * FROM users WHERE age = 20;

// Map
db.Find(&users, map[string]interface{}{"age": 20})
// SELECT * FROM users WHERE age = 20;
```

### Not 条件

Build NOT conditions, works similar to `Where`

```
db.Not("name = ?", "jinzhu").First(&user)
// SELECT * FROM users WHERE NOT name = "jinzhu" ORDER BY id LIMIT 1;

// Not In
db.Not(map[string]interface{}{"name": []string{"jinzhu", "jinzhu 2"}}).Find(&users)
// SELECT * FROM users WHERE name NOT IN ("jinzhu", "jinzhu 2");

// Struct
db.Not(User{Name: "jinzhu", Age: 18}).First(&user)
// SELECT * FROM users WHERE name <> "jinzhu" AND age <> 18 ORDER BY id LIMIT 1;

// Not In slice of primary keys
db.Not([]int64{1,2,3}).First(&user)
// SELECT * FROM users WHERE id NOT IN (1,2,3) ORDER BY id LIMIT 1;
```

### Or 条件

```
db.Where("role = ?", "admin").Or("role = ?", "super_admin").Find(&users)
// SELECT * FROM users WHERE role = 'admin' OR role = 'super_admin';

// Struct
db.Where("name = 'jinzhu'").Or(User{Name: "jinzhu 2", Age: 18}).Find(&users)
// SELECT * FROM users WHERE name = 'jinzhu' OR (name = 'jinzhu 2' AND age = 18);

// Map
db.Where("name = 'jinzhu'").Or(map[string]interface{}{"name": "jinzhu 2", "age": 18}).Find(&users)
// SELECT * FROM users WHERE name = 'jinzhu' OR (name = 'jinzhu 2' AND age = 18);
```

For more complicated SQL queries. please also refer to [Group Conditions in Advanced Query](https://gorm.io/zh_CN/docs/advanced_query.html#group_conditions).

## 选择特定字段

`Select` allows you to specify the fields that you want to retrieve from database. Otherwise, GORM will select all fields by default.

```
db.Select("name", "age").Find(&users)
// SELECT name, age FROM users;

db.Select([]string{"name", "age"}).Find(&users)
// SELECT name, age FROM users;

db.Table("users").Select("COALESCE(age,?)", 42).Rows()
// SELECT COALESCE(age,'42') FROM users;
```

Also check out [Smart Select Fields](https://gorm.io/zh_CN/docs/advanced_query.html#smart_select)

## 排序

Specify order when retrieving records from the database

```
db.Order("age desc, name").Find(&users)
// SELECT * FROM users ORDER BY age desc, name;

// Multiple orders
db.Order("age desc").Order("name").Find(&users)
// SELECT * FROM users ORDER BY age desc, name;

db.Clauses(clause.OrderBy{
  Expression: clause.Expr{SQL: "FIELD(id,?)", Vars: []interface{}{[]int{1, 2, 3}}, WithoutParentheses: true},
}).Find(&User{})
// SELECT * FROM users ORDER BY FIELD(id,1,2,3)
```

## Limit & Offset

`Limit` specify the max number of records to retrieve `Offset` specify the number of records to skip before starting to return the records

```
db.Limit(3).Find(&users)
// SELECT * FROM users LIMIT 3;

// Cancel limit condition with -1
db.Limit(10).Find(&users1).Limit(-1).Find(&users2)
// SELECT * FROM users LIMIT 10; (users1)
// SELECT * FROM users; (users2)

db.Offset(3).Find(&users)
// SELECT * FROM users OFFSET 3;

db.Limit(10).Offset(5).Find(&users)
// SELECT * FROM users OFFSET 5 LIMIT 10;

// Cancel offset condition with -1
db.Offset(10).Find(&users1).Offset(-1).Find(&users2)
// SELECT * FROM users OFFSET 10; (users1)
// SELECT * FROM users; (users2)
```

Refer to [Pagination](https://gorm.io/zh_CN/docs/scopes.html#pagination) for details on how to make a paginator

## Group By & Having

```
type result struct {
  Date  time.Time
  Total int
}

db.Model(&User{}).Select("name, sum(age) as total").Where("name LIKE ?", "group%").Group("name").First(&result)
// SELECT name, sum(age) as total FROM `users` WHERE name LIKE "group%" GROUP BY `name` LIMIT 1


db.Model(&User{}).Select("name, sum(age) as total").Group("name").Having("name = ?", "group").Find(&result)
// SELECT name, sum(age) as total FROM `users` GROUP BY `name` HAVING name = "group"

rows, err := db.Table("orders").Select("date(created_at) as date, sum(amount) as total").Group("date(created_at)").Rows()
defer rows.Close()
for rows.Next() {
  ...
}

rows, err := db.Table("orders").Select("date(created_at) as date, sum(amount) as total").Group("date(created_at)").Having("sum(amount) > ?", 100).Rows()
defer rows.Close()
for rows.Next() {
  ...
}

type Result struct {
  Date  time.Time
  Total int64
}
db.Table("orders").Select("date(created_at) as date, sum(amount) as total").Group("date(created_at)").Having("sum(amount) > ?", 100).Scan(&results)
```

## Distinct

Selecting distinct values from the model

```
db.Distinct("name", "age").Order("name, age desc").Find(&results)
```

`Distinct` works with [`Pluck`](https://gorm.io/zh_CN/docs/advanced_query.html#pluck) and [`Count`](https://gorm.io/zh_CN/docs/advanced_query.html#count) too

## Joins

Specify Joins conditions

```
type result struct {
  Name  string
  Email string
}

db.Model(&User{}).Select("users.name, emails.email").Joins("left join emails on emails.user_id = users.id").Scan(&result{})
// SELECT users.name, emails.email FROM `users` left join emails on emails.user_id = users.id

rows, err := db.Table("users").Select("users.name, emails.email").Joins("left join emails on emails.user_id = users.id").Rows()
for rows.Next() {
  ...
}

db.Table("users").Select("users.name, emails.email").Joins("left join emails on emails.user_id = users.id").Scan(&results)

// multiple joins with parameter
db.Joins("JOIN emails ON emails.user_id = users.id AND emails.email = ?", "jinzhu@example.org").Joins("JOIN credit_cards ON credit_cards.user_id = users.id").Where("credit_cards.number = ?", "411111111111").Find(&user)
```

### Joins 预加载

You can use `Joins` eager loading associations with a single SQL, for example:

```
db.Joins("Company").Find(&users)
// SELECT `users`.`id`,`users`.`name`,`users`.`age`,`Company`.`id` AS `Company__id`,`Company`.`name` AS `Company__name` FROM `users` LEFT JOIN `companies` AS `Company` ON `users`.`company_id` = `Company`.`id`;

// inner join
db.InnerJoins("Company").Find(&users)
// SELECT `users`.`id`,`users`.`name`,`users`.`age`,`Company`.`id` AS `Company__id`,`Company`.`name` AS `Company__name` FROM `users` INNER JOIN `companies` AS `Company` ON `users`.`company_id` = `Company`.`id`;
```

Join with conditions

```
db.Joins("Company", db.Where(&Company{Alive: true})).Find(&users)
// SELECT `users`.`id`,`users`.`name`,`users`.`age`,`Company`.`id` AS `Company__id`,`Company`.`name` AS `Company__name` FROM `users` LEFT JOIN `companies` AS `Company` ON `users`.`company_id` = `Company`.`id` AND `Company`.`alive` = true;
```

For more details, please refer to [Preloading (Eager Loading)](https://gorm.io/zh_CN/docs/preload.html).

### Joins 一个衍生表

You can also use `Joins` to join a derived table.

```
type User struct {
    Id  int
    Age int
}

type Order struct {
    UserId     int
    FinishedAt *time.Time
}

query := db.Table("order").Select("MAX(order.finished_at) as latest").Joins("left join user user on order.user_id = user.id").Where("user.age > ?", 18).Group("order.user_id")
db.Model(&Order{}).Joins("join (?) q on order.finished_at = q.latest", query).Scan(&results)
// SELECT `order`.`user_id`,`order`.`finished_at` FROM `order` join (SELECT MAX(order.finished_at) as latest FROM `order` left join user user on order.user_id = user.id WHERE user.age > 18 GROUP BY `order`.`user_id`) q on order.finished_at = q.latest
```

## Scan

Scanning results into a struct works similarly to the way we use `Find`

```go
type Result struct {
  Name string
  Age  int
}

var result Result
db.Table("users").Select("name", "age").Where("name = ?", "Antonio").Scan(&result)

// Raw SQL
db.Raw("SELECT name, age FROM users WHERE name = ?", "Antonio").Scan(&result)
```

# 高级查询



## 智能选择字段

在 GORM 中，您可以使用 [`Select`](https://gorm.io/zh_CN/docs/query.html) 方法有效地选择特定字段。 这在Model字段较多但只需要其中部分的时候尤其有用，比如编写API响应。

```
type User struct {
  ID     uint
  Name   string
  Age    int
  Gender string
  // 很多很多字段
}

type APIUser struct {
  ID   uint
  Name string
}

// 在查询时，GORM 会自动选择 `id `, `name` 字段
db.Model(&User{}).Limit(10).Find(&APIUser{})
// SQL: SELECT `id`, `name` FROM `users` LIMIT 10
```

> **注意** 在 `QueryFields` 模式中, 所有的模型字段（model fields）都会被根据他们的名字选择。

```
db, err := gorm.Open(sqlite.Open("gorm.db"), &gorm.Config{
  QueryFields: true,
})

// 当 QueryFields 被设置为 true 时，此行为默认进行
db.Find(&user)
// SQL: SELECT `users`.`name`, `users`.`age`, ... FROM `users`

// 开启 QueryFields 并使用会话模式（Session mode）
db.Session(&gorm.Session{QueryFields: true}).Find(&user)
// SQL: SELECT `users`.`name`, `users`.`age`, ... FROM `users`
```

## 锁

GORM 支持多种类型的锁，例如：

```
// 基本的 FOR UPDATE 锁
db.Clauses(clause.Locking{Strength: "UPDATE"}).Find(&users)
// SQL: SELECT * FROM `users` FOR UPDATE
```

上述语句将会在事务（transaction）中锁定选中行（selected rows）。 可以被用于以下场景：当你准备在事务（transaction）中更新（update）一些行（rows）时，并且想要在本事务完成前，阻止（prevent）其他的事务（other transactions）修改你准备更新的选中行。

`Strength` 也可以被设置为 `SHARE` ，这种锁只允许其他事务读取（read）被锁定的内容，而无法修改（update）或者删除（delete）。

```
db.Clauses(clause.Locking{
  Strength: "SHARE",
  Table: clause.Table{Name: clause.CurrentTable},
}).Find(&users)
// SQL: SELECT * FROM `users` FOR SHARE OF `users`
```

`Table`选项用于指定将要被锁定的表。 这在你想要 join 多个表，并且锁定其一时非常有用。

你也可以提供如 `NOWAIT` 的Options，这将尝试获取一个锁，如果锁不可用，导致了获取失败，函数将会立即返回一个error。 当一个事务等待其他事务释放它们的锁时，此Options（Nowait）可以阻止这种行为

```
db.Clauses(clause.Locking{
  Strength: "UPDATE",
  Options: "NOWAIT",
}).Find(&users)
// SQL: SELECT * FROM `users` FOR UPDATE NOWAIT
```

Options也可以是`SKIP LOCKED`，设置后将跳过所有已经被其他事务锁定的行（any rows that are already locked by other transactions.）。 这次高并发情况下非常有用：那时你可能会想要对未经其他事务锁定的行进行操作（process ）。

想了解更多高级的锁策略，请参阅 [Raw SQL and SQL Builder](https://gorm.io/zh_CN/docs/sql_builder.html)。

## 子查询

子查询（Subquery）是SQL中非常强大的功能，它允许嵌套查询。 当你使用 *gorm.DB 对象作为参数时，GORM 可以自动生成子查询。

```
// 简单的子查询
db.Where("amount > (?)", db.Table("orders").Select("AVG(amount)")).Find(&orders)
// SQL: SELECT * FROM "orders" WHERE amount > (SELECT AVG(amount) FROM "orders");

// 内嵌子查询
subQuery := db.Select("AVG(age)").Where("name LIKE ?", "name%").Table("users")
db.Select("AVG(age) as avgage").Group("name").Having("AVG(age) > (?)", subQuery).Find(&results)
// SQL: SELECT AVG(age) as avgage FROM `users` GROUP BY `name` HAVING AVG(age) > (SELECT AVG(age) FROM `users` WHERE name LIKE "name%")
```

### From 子查询

GORM 允许在 FROM 子句中使用子查询，从而支持复杂的查询和数据组织。

```
// 在 FROM 子句中使用子查询
db.Table("(?) as u", db.Model(&User{}).Select("name", "age")).Where("age = ?", 18).Find(&User{})
// SQL: SELECT * FROM (SELECT `name`,`age` FROM `users`) as u WHERE `age` = 18

// 在 FROM 子句中结合多个子查询
subQuery1 := db.Model(&User{}).Select("name")
subQuery2 := db.Model(&Pet{}).Select("name")
db.Table("(?) as u, (?) as p", subQuery1, subQuery2).Find(&User{})
// SQL: SELECT * FROM (SELECT `name` FROM `users`) as u, (SELECT `name` FROM `pets`) as p
```

## Group 条件

GORM 中的Group条件（Group Conditions）提供了一种可读性更强，操作性更强的方法来写复杂的，涉及多个条件的 SQL 查询。

```
// 使用 Group 条件的复杂 SQL 查询
db.Where(
  db.Where("pizza = ?", "pepperoni").Where(db.Where("size = ?", "small").Or("size = ?", "medium")),
).Or(
  db.Where("pizza = ?", "hawaiian").Where("size = ?", "xlarge"),
).Find(&Pizza{})
// SQL: SELECT * FROM `pizzas` WHERE (pizza = "pepperoni" AND (size = "small" OR size = "medium")) OR (pizza = "hawaiian" AND size = "xlarge")
```

## 带多个列的 In

GROM 支持多列的 IN 子句（the IN clause with multiple columns），允许你在单次查询里基于多个字段值筛选数据。

```
// 多列 IN
db.Where("(name, age, role) IN ?", [][]interface{}{{"jinzhu", 18, "admin"}, {"jinzhu2", 19, "user"}}).Find(&users)
// SQL: SELECT * FROM users WHERE (name, age, role) IN (("jinzhu", 18, "admin"), ("jinzhu 2", 19, "user"));
```

## 命名参数

GORM 支持命名的参数，提高SQL 查询的可读性和可维护性。 此功能使查询结构更加清晰、更加有条理，尤其是在有多个参数的复杂查询中。 命名参数可以使用 [`sql.NamedArg`](https://tip.golang.org/pkg/database/sql/#NamedArg) 或 `map[string]interface{}{}}`，你可以根据你的查询结构灵活提供。

```
// 使用 sql.NamedArg 命名参数的例子
db.Where("name1 = @name OR name2 = @name", sql.Named("name", "jinzhu")).Find(&user)
// SQL: SELECT * FROM `users` WHERE name1 = "jinzhu" OR name2 = "jinzhu"

// 使用 map 命名参数的例子
db.Where("name1 = @name OR name2 = @name", map[string]interface{}{"name": "jinzhu"}).First(&user)
// SQL: SELECT * FROM `users` WHERE name1 = "jinzhu" OR name2 = "jinzhu" ORDER BY `users`.`id` LIMIT 1
```

欲了解更多示例和详细信息，请参阅 [Raw SQL 和 SQL Builder](https://gorm.io/zh_CN/docs/sql_builder.html#named_argument)

## Find 至 map

GORM 提供了灵活的数据查询，允许将结果扫描进（scanned into）`map[string]interface{}` or `[]map[string]interface{}`，这对动态数据结构非常有用。

当使用 `Find To Map`时，一定要在你的查询中包含 `Model` 或者 `Table` ，以此来显式地指定表名。 这能确保 GORM 正确的理解哪个表要被查询。

```
// 扫描第一个结果到 map with Model 中
result := map[string]interface{}{}
db.Model(&User{}).First(&result, "id = ?", 1)
// SQL: SELECT * FROM `users` WHERE id = 1 LIMIT 1

// 扫描多个结果到部分 maps with Table 中
var results []map[string]interface{}
db.Table("users").Find(&results)
// SQL: SELECT * FROM `users`
```

## FirstOrInit

GORM 的 `FirstOrInit` 方法用于获取与特定条件匹配的第一条记录，如果没有成功获取，就初始化一个新实例。 这个方法与结构和map条件兼容，并且在使用 `Attrs` 和 `Assign` 方法时有着更多的灵活性。

```
// 如果没找到 name 为 "non_existing" 的 User，就初始化一个新的 User
var user User
db.FirstOrInit(&user, User{Name: "non_existing"})
// user -> User{Name: "non_existing"} if not found

// 检索名为 “jinzhu” 的 User
db.Where(User{Name: "jinzhu"}).FirstOrInit(&user)
// user -> User{ID: 111, Name: "Jinzhu", Age: 18} if found

// 使用 map 来指定搜索条件
db.FirstOrInit(&user, map[string]interface{}{"name": "jinzhu"})
// user -> User{ID: 111, Name: "Jinzhu", Age: 18} if found
```

### 使用 `Attrs` 进行初始化

当记录未找到，你可以使用 `Attrs` 来初始化一个有着额外属性的结构体。 这些属性包含在新结构中，但不在 SQL 查询中使用。

```
// 如果没找到 User，根据所给条件和额外属性初始化 User
db.Where(User{Name: "non_existing"}).Attrs(User{Age: 20}).FirstOrInit(&user)
// SQL: SELECT * FROM USERS WHERE name = 'non_existing' ORDER BY id LIMIT 1;
// user -> User{Name: "non_existing", Age: 20} if not found

// 如果名为 “Jinzhu” 的 User 被找到，`Attrs` 会被忽略
db.Where(User{Name: "Jinzhu"}).Attrs(User{Age: 20}).FirstOrInit(&user)
// SQL: SELECT * FROM USERS WHERE name = 'Jinzhu' ORDER BY id LIMIT 1;
// user -> User{ID: 111, Name: "Jinzhu", Age: 18} if found
```

### 为属性使用 `Assign`

`Assign` 方法允许您在结构上设置属性，不管是否找到记录。 这些属性设定在结构上，但不用于生成 SQL 查询，最终数据不会被保存到数据库。

```
// 根据所给条件和分配的属性初始化，不管记录是否存在
db.Where(User{Name: "non_existing"}).Assign(User{Age: 20}).FirstOrInit(&user)
// user -> User{Name: "non_existing", Age: 20} if not found

// 如果找到了名为“Jinzhu”的用户，使用分配的属性更新结构体
db.Where(User{Name: "Jinzhu"}).Assign(User{Age: 20}).FirstOrInit(&user)
// SQL: SELECT * FROM USERS WHERE name = 'Jinzhu' ORDER BY id LIMIT 1;
// user -> User{ID: 111, Name: "Jinzhu", Age: 20} if found
```

`FirstOrInit`, 以及 `Attrs` 和 `Assign`, 提供了一种强大和灵活的方法来确保记录的存在，并且在一个步骤中以特定的属性初始化或更新。

## FirstOrCreate

`FirstOrCreate` 用于获取与特定条件匹配的第一条记录，或者如果没有找到匹配的记录，创建一个新的记录。 这个方法在结构和map条件下都是有效的。 `受RowsAffected的` 属性有助于确定创建或更新记录的数量。

```
// 如果没找到，就创建一个新纪录
result := db.FirstOrCreate(&user, User{Name: "non_existing"})
// SQL: INSERT INTO "users" (name) VALUES ("non_existing");
// user -> User{ID: 112, Name: "non_existing"}
// result.RowsAffected // => 1 (record created)

// 如果用户已经被找到，不会创建新纪录
result = db.Where(User{Name: "jinzhu"}).FirstOrCreate(&user)
// user -> User{ID: 111, Name: "jinzhu", Age: 18}
// result.RowsAffected // => 0 (no record created)
```

### 配合 `Attrs` 使用 FirstOrCreate

`Attrs` 可以用于指定新记录的附加属性。 这些属性用于创建，但不在初始搜索查询中。

```
// 如果没找到，根据额外属性创建新的记录
db.Where(User{Name: "non_existing"}).Attrs(User{Age: 20}).FirstOrCreate(&user)
// SQL: SELECT * FROM users WHERE name = 'non_existing';
// SQL: INSERT INTO "users" (name, age) VALUES ("non_existing", 20);
// user -> User{ID: 112, Name: "non_existing", Age: 20}

// 如果user被找到了，`Attrs` 会被忽略
db.Where(User{Name: "jinzhu"}).Attrs(User{Age: 20}).FirstOrCreate(&user)
// SQL: SELECT * FROM users WHERE name = 'jinzhu';
// user -> User{ID: 111, Name: "jinzhu", Age: 18}
```

### 配合 `Assign` 使用 FirstOrCreate

不管记录是否被找到，`Assign` 方法都会设置记录中的属性。 并且这些属性被保存到数据库。

```
// 如果没找到记录，通过 `Assign` 属性 初始化并且保存新的记录
db.Where(User{Name: "non_existing"}).Assign(User{Age: 20}).FirstOrCreate(&user)
// SQL: SELECT * FROM users WHERE name = 'non_existing';
// SQL: INSERT INTO "users" (name, age) VALUES ("non_existing", 20);
// user -> User{ID: 112, Name: "non_existing", Age: 20}

// 通过 `Assign` 属性 更新记录
db.Where(User{Name: "jinzhu"}).Assign(User{Age: 20}).FirstOrCreate(&user)
// SQL: SELECT * FROM users WHERE name = 'jinzhu';
// SQL: UPDATE users SET age=20 WHERE id = 111;
// user -> User{ID: 111, Name: "Jinzhu", Age: 20}
```

## 优化器、索引提示

GORM 包括对优化器和索引提示的支持, 允许您影响查询优化器的执行计划。 这对于优化查询性能或处理复杂查询尤其有用。

优化器提示是说明数据库查询优化器应如何执行查询的指令。 GORM 通过 gorm.io/hints 包简化了优化器提示的使用。

```
import "gorm.io/hints"

// 使用优化器提示来设置最大执行时长
db.Clauses(hints.New("MAX_EXECUTION_TIME(10000)")).Find(&User{})
// SQL: SELECT * /*+ MAX_EXECUTION_TIME(10000) */ FROM `users`
```

### 索引提示

索引提示为数据库提供关于使用哪些索引的指导。 如果查询规划者没有为查询选择最有效的索引，它们（索引提示）将是有好处的。

```
import "gorm.io/hints"

// 对指定索引提供建议
db.Clauses(hints.UseIndex("idx_user_name")).Find(&User{})
// SQL: SELECT * FROM `users` USE INDEX (`idx_user_name`)

// 强制对JOIN操作使用某些索引
db.Clauses(hints.ForceIndex("idx_user_name", "idx_user_id").ForJoin()).Find(&User{})
// SQL: SELECT * FROM `users` FORCE INDEX FOR JOIN (`idx_user_name`,`idx_user_id`)
```

这些提示会对查询性能和行为产生显著影响（significantly impact），特别是在大型数据库或复杂的数据模型中。 欲了解更详细的信息和其他示例，请参阅GORM 文档中的 [Optimizer Hints/Index/Comment](https://gorm.io/zh_CN/docs/hints.html)。

## 迭代

GORM 支持使用 `Rows` 方法对查询结果进行迭代。 当您需要处理大型数据集或在每个记录上单独执行操作时，此功能特别有用。

您可以通过对查询返回的行进行迭代，扫描每行到一个结构体中。 该方法提供了对如何处理每条记录的粒度控制。（granular control）。

```
rows, err := db.Model(&User{}).Where("name = ?", "jinzhu").Rows()
defer rows.Close()

for rows.Next() {
  var user User
  // ScanRows 扫描每一行进结构体
  db.ScanRows(rows, &user)

  // 对每一个 User 进行操作
}
```

这种方法非常适合于使用标准查询方法无法轻松实现的复杂数据处理。

## FindInBatches

`FindInBatches` 允许分批查询和处理记录。 这对于有效地处理大型数据集、减少内存使用和提高性能尤其有用。

使用`FindInBatches`, GORM 处理指定批大小的记录。 在批处理功能中，您可以对每批记录应用操作。

```
// 处理记录，批处理大小为100
result := db.Where("processed = ?", false).FindInBatches(&results, 100, func(tx *gorm.DB, batch int) error {
  for _, result := range results {
    // 对批中的每条记录进行操作
  }

  // 保存对当前批记录的修改
  tx.Save(&results)

  // tx.RowsAffected 提供当前批处理中记录的计数（the count of records in the current batch）
  // 'batch' 变量表示当前批号（the current batch number）

  // 返回 error 将阻止更多的批处理
  return nil
})

// result.Error 包含批处理过程中遇到的任何错误
// result.RowsAffected 提供跨批处理的所有记录的计数（the count of all processed records across batches）
```

`FindInBatches` 是处理大量可管理数据的有效工具，可以优化资源使用和性能。

## 查询钩子

GORM 提供了使用钩子的能力，例如 `AfterFind`，这些钩子是在查询的生命周期中触发的。 These hooks allow for custom logic to be executed at specific points, such as after a record has been retrieved from the database.

此钩子对后查询数据操纵或默认值设置非常有用。 欲了解更详细的信息和额外的钩子，请参阅GORM文档中的 [Hooks](https://gorm.io/zh_CN/docs/hooks.html)。

```
func (u *User) AfterFind(tx *gorm.DB) (err error) {
  // 在找到 user 后自定义逻辑
  if u.Role == "" {
    u.Role = "user" // 如果没有指定，将设置默认 role
  }
  return
}

// 当用户被查询时，会自动使用AfterFind钩子
```

## Pluck

GORM 中的 `Pluck` 方法用于从数据库中查询单列并扫描结果到片段（slice）。 当您需要从模型中检索特定字段时，此方法非常理想。

如果需要查询多个列，可以使用 `Select` 配合 [Scan](https://gorm.io/zh_CN/docs/query.html) 或者 [Find](https://gorm.io/zh_CN/docs/query.html) 来代替。

```
// 检索所有用户的 age
var ages []int64
db.Model(&User{}).Pluck("age", &ages)

// 检索所有用户的 name
var names []string
db.Model(&User{}).Pluck("name", &names)

// 从不同的表中检索 name
db.Table("deleted_users").Pluck("name", &names)

// 使用Distinct和Pluck
db.Model(&User{}).Distinct().Pluck("Name", &names)
// SQL: SELECT DISTINCT `name` FROM `users`

// 多列查询
db.Select("name", "age").Scan(&users)
db.Select("name", "age").Find(&users)
```

## Scope

GORM中的 `Scopes` 是一个强大的特性，它允许您将常用的查询条件定义为可重用的方法。 这些作用域可以很容易地在查询中引用，从而使代码更加模块化和可读。

### 定义 Scopes

`Scopes` 被定义为被修改后返回一个 `gorm.DB` 实例的函数。 您可以根据您的应用程序的需要定义各种条件作为范围。

```
// Scope for filtering records where amount is greater than 1000
func AmountGreaterThan1000(db *gorm.DB) *gorm.DB {
  return db.Where("amount > ?", 1000)
}

// Scope for orders paid with a credit card
func PaidWithCreditCard(db *gorm.DB) *gorm.DB {
  return db.Where("pay_mode_sign = ?", "C")
}

// Scope for orders paid with cash on delivery (COD)
func PaidWithCod(db *gorm.DB) *gorm.DB {
  return db.Where("pay_mode_sign = ?", "COD")
}

// Scope for filtering orders by status
func OrderStatus(status []string) func(db *gorm.DB) *gorm.DB {
  return func(db *gorm.DB) *gorm.DB {
    return db.Where("status IN (?)", status)
  }
}
```

### 在查询中使用 Scopes

你可以通过 `Scopes` 方法使用一个或者多个 Scope 来查询。 这允许您动态地连接多个条件。

```
// 使用 scopes 来寻找所有的 金额大于1000的信用卡订单
db.Scopes(AmountGreaterThan1000, PaidWithCreditCard).Find(&orders)

// 使用 scopes 来寻找所有的 金额大于1000的货到付款（COD）订单
db.Scopes(AmountGreaterThan1000, PaidWithCod).Find(&orders)

//使用 scopes 来寻找所有的 具有特定状态且金额大于1000的订单
db.Scopes(AmountGreaterThan1000, OrderStatus([]string{"paid", "shipped"})).Find(&orders)
```

`Scopes` 是封装普通查询逻辑的一种干净而有效的方式，增强了代码的可维护性和可读性。 更详细的示例和用法，请参阅GORM 文档中的 [范围](https://gorm.io/zh_CN/docs/scopes.html)。

## Count

GORM中的 `Count` 方法用于检索匹配给定查询的记录数。 这是了解数据集大小的一个有用的功能，特别是在涉及有条件查询或数据分析的情况下。

### 得到匹配记录的 Count

您可以使用 `Count` 来确定符合您的查询中符合特定标准的记录的数量。

```
var count int64

// 计数 有着特定名字的 users
db.Model(&User{}).Where("name = ?", "jinzhu").Or("name = ?", "jinzhu 2").Count(&count)
// SQL: SELECT count(1) FROM users WHERE name = 'jinzhu' OR name = 'jinzhu 2'

// 计数 有着单一名字条件（single name condition）的 users
db.Model(&User{}).Where("name = ?", "jinzhu").Count(&count)
// SQL: SELECT count(1) FROM users WHERE name = 'jinzhu'

// 在不同的表中对记录计数
db.Table("deleted_users").Count(&count)
// SQL: SELECT count(1) FROM deleted_users
```

### 配合 Distinct 和 Group 使用 Count

GORM还允许对不同的值进行计数并对结果进行分组。

```go
// 为不同 name 计数
db.Model(&User{}).Distinct("name").Count(&count)
// SQL: SELECT COUNT(DISTINCT(`name`)) FROM `users`

// 使用自定义选择（custom select）计数不同的值
db.Table("deleted_users").Select("count(distinct(name))").Count(&count)
// SQL: SELECT count(distinct(name)) FROM deleted_users

// 分组记录计数
users := []User{
  {Name: "name1"},
  {Name: "name2"},
  {Name: "name3"},
  {Name: "name3"},
}

db.Model(&User{}).Group("name").Count(&count)
// 按名称分组后计数
// count => 3
```

# 更新



## 保存所有字段

`Save` 会保存所有的字段，即使字段是零值

```
db.First(&user)

user.Name = "jinzhu 2"
user.Age = 100
db.Save(&user)
// UPDATE users SET name='jinzhu 2', age=100, birthday='2016-01-01', updated_at = '2013-11-17 21:34:10' WHERE id=111;
```

`保存` 是一个组合函数。 如果保存值不包含主键，它将执行 `Create`，否则它将执行 `Update` (包含所有字段)。

```
db.Save(&User{Name: "jinzhu", Age: 100})
// INSERT INTO `users` (`name`,`age`,`birthday`,`update_at`) VALUES ("jinzhu",100,"0000-00-00 00:00:00","0000-00-00 00:00:00")

db.Save(&User{ID: 1, Name: "jinzhu", Age: 100})
// UPDATE `users` SET `name`="jinzhu",`age`=100,`birthday`="0000-00-00 00:00:00",`update_at`="0000-00-00 00:00:00" WHERE `id` = 1
```

> **NOTE**不要将 `Save` 和 `Model`一同使用, 这是 **未定义的行为**。

## 更新单个列

当使用 `Update` 更新单列时，需要有一些条件，否则将会引起`ErrMissingWhereClause` 错误，查看 [阻止全局更新](https://gorm.io/zh_CN/docs/update.html#block_global_updates) 了解详情。 当使用 `Model` 方法，并且它有主键值时，主键将会被用于构建条件，例如：

```
// 根据条件更新
db.Model(&User{}).Where("active = ?", true).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE active=true;

// User 的 ID 是 `111`
db.Model(&user).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111;

// 根据条件和 model 的值进行更新
db.Model(&user).Where("active = ?", true).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111 AND active=true;
```

## 更新多列

`Updates` 方法支持 `struct` 和 `map[string]interface{}` 参数。当使用 `struct` 更新时，默认情况下GORM 只会更新非零值的字段

```
// 根据 `struct` 更新属性，只会更新非零值的字段
db.Model(&user).Updates(User{Name: "hello", Age: 18, Active: false})
// UPDATE users SET name='hello', age=18, updated_at = '2013-11-17 21:34:10' WHERE id = 111;

// 根据 `map` 更新属性
db.Model(&user).Updates(map[string]interface{}{"name": "hello", "age": 18, "active": false})
// UPDATE users SET name='hello', age=18, active=false, updated_at='2013-11-17 21:34:10' WHERE id=111;
```

> **注意** 使用 struct 更新时, GORM 将只更新非零值字段。 你可能想用 `map` 来更新属性，或者使用 `Select` 声明字段来更新

## 更新选定字段

如果您想要在更新时选择、忽略某些字段，您可以使用 `Select`、`Omit`

```
// 选择 Map 的字段
// User 的 ID 是 `111`:
db.Model(&user).Select("name").Updates(map[string]interface{}{"name": "hello", "age": 18, "active": false})
// UPDATE users SET name='hello' WHERE id=111;

db.Model(&user).Omit("name").Updates(map[string]interface{}{"name": "hello", "age": 18, "active": false})
// UPDATE users SET age=18, active=false, updated_at='2013-11-17 21:34:10' WHERE id=111;

// 选择 Struct 的字段（会选中零值的字段）
db.Model(&user).Select("Name", "Age").Updates(User{Name: "new_name", Age: 0})
// UPDATE users SET name='new_name', age=0 WHERE id=111;

// 选择所有字段（选择包括零值字段的所有字段）
db.Model(&user).Select("*").Updates(User{Name: "jinzhu", Role: "admin", Age: 0})

// 选择除 Role 外的所有字段（包括零值字段的所有字段）
db.Model(&user).Select("*").Omit("Role").Updates(User{Name: "jinzhu", Role: "admin", Age: 0})
```

## 更新 Hook

GORM 支持的 hook 包括：`BeforeSave`, `BeforeUpdate`, `AfterSave`, `AfterUpdate`. 更新记录时将调用这些方法，查看 [Hooks](https://gorm.io/zh_CN/docs/hooks.html) 获取详细信息

```
func (u *User) BeforeUpdate(tx *gorm.DB) (err error) {
    if u.Role == "admin" {
        return errors.New("admin user not allowed to update")
    }
    return
}
```

## 批量更新

If we haven’t specified a record having a primary key value with `Model`, GORM will perform a batch update

```
// Update with struct
db.Model(User{}).Where("role = ?", "admin").Updates(User{Name: "hello", Age: 18})
// UPDATE users SET name='hello', age=18 WHERE role = 'admin';

// Update with map
db.Table("users").Where("id IN ?", []int{10, 11}).Updates(map[string]interface{}{"name": "hello", "age": 18})
// UPDATE users SET name='hello', age=18 WHERE id IN (10, 11);
```

### 阻止全局更新

If you perform a batch update without any conditions, GORM WON’T run it and will return `ErrMissingWhereClause` error by default

You have to use some conditions or use raw SQL or enable the `AllowGlobalUpdate` mode, for example:

```
db.Model(&User{}).Update("name", "jinzhu").Error // gorm.ErrMissingWhereClause

db.Model(&User{}).Where("1 = 1").Update("name", "jinzhu")
// UPDATE users SET `name` = "jinzhu" WHERE 1=1

db.Exec("UPDATE users SET name = ?", "jinzhu")
// UPDATE users SET name = "jinzhu"

db.Session(&gorm.Session{AllowGlobalUpdate: true}).Model(&User{}).Update("name", "jinzhu")
// UPDATE users SET `name` = "jinzhu"
```

### 更新的记录数

Get the number of rows affected by a update

```
// Get updated records count with `RowsAffected`
result := db.Model(User{}).Where("role = ?", "admin").Updates(User{Name: "hello", Age: 18})
// UPDATE users SET name='hello', age=18 WHERE role = 'admin';

result.RowsAffected // returns updated records count
result.Error        // returns updating error
```

## 高级选项

### 使用 SQL 表达式更新

GORM allows updating a column with a SQL expression, e.g:

```
// product's ID is `3`
db.Model(&product).Update("price", gorm.Expr("price * ? + ?", 2, 100))
// UPDATE "products" SET "price" = price * 2 + 100, "updated_at" = '2013-11-17 21:34:10' WHERE "id" = 3;

db.Model(&product).Updates(map[string]interface{}{"price": gorm.Expr("price * ? + ?", 2, 100)})
// UPDATE "products" SET "price" = price * 2 + 100, "updated_at" = '2013-11-17 21:34:10' WHERE "id" = 3;

db.Model(&product).UpdateColumn("quantity", gorm.Expr("quantity - ?", 1))
// UPDATE "products" SET "quantity" = quantity - 1 WHERE "id" = 3;

db.Model(&product).Where("quantity > 1").UpdateColumn("quantity", gorm.Expr("quantity - ?", 1))
// UPDATE "products" SET "quantity" = quantity - 1 WHERE "id" = 3 AND quantity > 1;
```

And GORM also allows updating with SQL Expression/Context Valuer with [Customized Data Types](https://gorm.io/zh_CN/docs/data_types.html#gorm_valuer_interface), e.g:

```
// Create from customized data type
type Location struct {
    X, Y int
}

func (loc Location) GormValue(ctx context.Context, db *gorm.DB) clause.Expr {
  return clause.Expr{
    SQL:  "ST_PointFromText(?)",
    Vars: []interface{}{fmt.Sprintf("POINT(%d %d)", loc.X, loc.Y)},
  }
}

db.Model(&User{ID: 1}).Updates(User{
  Name:  "jinzhu",
  Location: Location{X: 100, Y: 100},
})
// UPDATE `user_with_points` SET `name`="jinzhu",`location`=ST_PointFromText("POINT(100 100)") WHERE `id` = 1
```

### 根据子查询进行更新

Update a table by using SubQuery

```
db.Model(&user).Update("company_name", db.Model(&Company{}).Select("name").Where("companies.id = users.company_id"))
// UPDATE "users" SET "company_name" = (SELECT name FROM companies WHERE companies.id = users.company_id);

db.Table("users as u").Where("name = ?", "jinzhu").Update("company_name", db.Table("companies as c").Select("name").Where("c.id = u.company_id"))

db.Table("users as u").Where("name = ?", "jinzhu").Updates(map[string]interface{}{"company_name": db.Table("companies as c").Select("name").Where("c.id = u.company_id")})
```

### 不使用 Hook 和时间追踪

If you want to skip `Hooks` methods and don’t track the update time when updating, you can use `UpdateColumn`, `UpdateColumns`, it works like `Update`, `Updates`

```
// Update single column
db.Model(&user).UpdateColumn("name", "hello")
// UPDATE users SET name='hello' WHERE id = 111;

// Update multiple columns
db.Model(&user).UpdateColumns(User{Name: "hello", Age: 18})
// UPDATE users SET name='hello', age=18 WHERE id = 111;

// Update selected columns
db.Model(&user).Select("name", "age").UpdateColumns(User{Name: "hello", Age: 0})
// UPDATE users SET name='hello', age=0 WHERE id = 111;
```

### 返回修改行的数据

Returning changed data only works for databases which support Returning, for example:

```
// return all columns
var users []User
db.Model(&users).Clauses(clause.Returning{}).Where("role = ?", "admin").Update("salary", gorm.Expr("salary * ?", 2))
// UPDATE `users` SET `salary`=salary * 2,`updated_at`="2021-10-28 17:37:23.19" WHERE role = "admin" RETURNING *
// users => []User{{ID: 1, Name: "jinzhu", Role: "admin", Salary: 100}, {ID: 2, Name: "jinzhu.2", Role: "admin", Salary: 1000}}

// return specified columns
db.Model(&users).Clauses(clause.Returning{Columns: []clause.Column{{Name: "name"}, {Name: "salary"}}}).Where("role = ?", "admin").Update("salary", gorm.Expr("salary * ?", 2))
// UPDATE `users` SET `salary`=salary * 2,`updated_at`="2021-10-28 17:37:23.19" WHERE role = "admin" RETURNING `name`, `salary`
// users => []User{{ID: 0, Name: "jinzhu", Role: "", Salary: 100}, {ID: 0, Name: "jinzhu.2", Role: "", Salary: 1000}}
```

### 检查字段是否有变更？

GORM provides the `Changed` method which could be used in **Before Update Hooks**, it will return whether the field has changed or not.

The `Changed` method only works with methods `Update`, `Updates`, and it only checks if the updating value from `Update` / `Updates` equals the model value. It will return true if it is changed and not omitted

```
func (u *User) BeforeUpdate(tx *gorm.DB) (err error) {
  // if Role changed
    if tx.Statement.Changed("Role") {
    return errors.New("role not allowed to change")
    }

  if tx.Statement.Changed("Name", "Admin") { // if Name or Role changed
    tx.Statement.SetColumn("Age", 18)
  }

  // if any fields changed
    if tx.Statement.Changed() {
        tx.Statement.SetColumn("RefreshedAt", time.Now())
    }
    return nil
}

db.Model(&User{ID: 1, Name: "jinzhu"}).Updates(map[string]interface{"name": "jinzhu2"})
// Changed("Name") => true
db.Model(&User{ID: 1, Name: "jinzhu"}).Updates(map[string]interface{"name": "jinzhu"})
// Changed("Name") => false, `Name` not changed
db.Model(&User{ID: 1, Name: "jinzhu"}).Select("Admin").Updates(map[string]interface{
  "name": "jinzhu2", "admin": false,
})
// Changed("Name") => false, `Name` not selected to update

db.Model(&User{ID: 1, Name: "jinzhu"}).Updates(User{Name: "jinzhu2"})
// Changed("Name") => true
db.Model(&User{ID: 1, Name: "jinzhu"}).Updates(User{Name: "jinzhu"})
// Changed("Name") => false, `Name` not changed
db.Model(&User{ID: 1, Name: "jinzhu"}).Select("Admin").Updates(User{Name: "jinzhu2"})
// Changed("Name") => false, `Name` not selected to update
```

### 在 Update 时修改值

To change updating values in Before Hooks, you should use `SetColumn` unless it is a full update with `Save`, for example:

```go
func (user *User) BeforeSave(tx *gorm.DB) (err error) {
  if pw, err := bcrypt.GenerateFromPassword(user.Password, 0); err == nil {
    tx.Statement.SetColumn("EncryptedPassword", pw)
  }

  if tx.Statement.Changed("Code") {
    user.Age += 20
    tx.Statement.SetColumn("Age", user.Age)
  }
}

db.Model(&user).Update("Name", "jinzhu")
```

# 删除



## 删除一条记录

删除一条记录时，删除对象需要指定主键，否则会触发 [批量删除](https://gorm.io/zh_CN/docs/delete.html#batch_delete)，例如：

```
// Email 的 ID 是 `10`
db.Delete(&email)
// DELETE from emails where id = 10;

// 带额外条件的删除
db.Where("name = ?", "jinzhu").Delete(&email)
// DELETE from emails where id = 10 AND name = "jinzhu";
```

## 根据主键删除

GORM 允许通过主键(可以是复合主键)和内联条件来删除对象，它可以使用数字（如以下例子。也可以使用字符串——译者注）。查看 [查询-内联条件（Query Inline Conditions）](https://gorm.io/zh_CN/docs/query.html#inline_conditions) 了解详情。

```
db.Delete(&User{}, 10)
// DELETE FROM users WHERE id = 10;

db.Delete(&User{}, "10")
// DELETE FROM users WHERE id = 10;

db.Delete(&users, []int{1,2,3})
// DELETE FROM users WHERE id IN (1,2,3);
```

## 钩子函数

对于删除操作，GORM 支持 `BeforeDelete`、`AfterDelete` Hook，在删除记录时会调用这些方法，查看 [Hook](https://gorm.io/zh_CN/docs/hooks.html) 获取详情

```
func (u *User) BeforeDelete(tx *gorm.DB) (err error) {
    if u.Role == "admin" {
        return errors.New("admin user not allowed to delete")
    }
    return
}
```

## 批量删除

如果指定的值不包括主属性，那么 GORM 会执行批量删除，它将删除所有匹配的记录

```
db.Where("email LIKE ?", "%jinzhu%").Delete(&Email{})
// DELETE from emails where email LIKE "%jinzhu%";

db.Delete(&Email{}, "email LIKE ?", "%jinzhu%")
// DELETE from emails where email LIKE "%jinzhu%";
```

可以将一个主键切片传递给`Delete` 方法，以便更高效的删除数据量大的记录

```
var users = []User{{ID: 1}, {ID: 2}, {ID: 3}}
db.Delete(&users)
// DELETE FROM users WHERE id IN (1,2,3);

db.Delete(&users, "name LIKE ?", "%jinzhu%")
// DELETE FROM users WHERE name LIKE "%jinzhu%" AND id IN (1,2,3); 
```

### 阻止全局删除

当你试图执行不带任何条件的批量删除时，GORM将不会运行并返回`ErrMissingWhereClause` 错误

如果一定要这么做，你必须添加一些条件，或者使用原生SQL，或者开启`AllowGlobalUpdate` 模式，如下例：

```
db.Delete(&User{}).Error // gorm.ErrMissingWhereClause

db.Delete(&[]User{{Name: "jinzhu1"}, {Name: "jinzhu2"}}).Error // gorm.ErrMissingWhereClause

db.Where("1 = 1").Delete(&User{})
// DELETE FROM `users` WHERE 1=1

db.Exec("DELETE FROM users")
// DELETE FROM users

db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&User{})
// DELETE FROM users
```

### 返回删除行的数据

返回被删除的数据，仅当数据库支持回写功能时才能正常运行，如下例：

```
// 回写所有的列
var users []User
DB.Clauses(clause.Returning{}).Where("role = ?", "admin").Delete(&users)
// DELETE FROM `users` WHERE role = "admin" RETURNING *
// users => []User{{ID: 1, Name: "jinzhu", Role: "admin", Salary: 100}, {ID: 2, Name: "jinzhu.2", Role: "admin", Salary: 1000}}

// 回写指定的列
DB.Clauses(clause.Returning{Columns: []clause.Column{{Name: "name"}, {Name: "salary"}}}).Where("role = ?", "admin").Delete(&users)
// DELETE FROM `users` WHERE role = "admin" RETURNING `name`, `salary`
// users => []User{{ID: 0, Name: "jinzhu", Role: "", Salary: 100}, {ID: 0, Name: "jinzhu.2", Role: "", Salary: 1000}}
```

## 软删除

如果你的模型包含了 `gorm.DeletedAt`字段（该字段也被包含在`gorm.Model`中），那么该模型将会自动获得软删除的能力！

当调用`Delete`时，GORM并不会从数据库中删除该记录，而是将该记录的`DeleteAt`设置为当前时间，而后的一般查询方法将无法查找到此条记录。

```
// user's ID is `111`
db.Delete(&user)
// UPDATE users SET deleted_at="2013-10-29 10:23" WHERE id = 111;

// Batch Delete
db.Where("age = ?", 20).Delete(&User{})
// UPDATE users SET deleted_at="2013-10-29 10:23" WHERE age = 20;

// Soft deleted records will be ignored when querying
db.Where("age = 20").Find(&user)
// SELECT * FROM users WHERE age = 20 AND deleted_at IS NULL;
```

如果你并不想嵌套`gorm.Model`，你也可以像下方例子那样开启软删除特性：

```
type User struct {
  ID      int
  Deleted gorm.DeletedAt
  Name    string
}
```

### 查找被软删除的记录

你可以使用`Unscoped`来查询到被软删除的记录

```
db.Unscoped().Where("age = 20").Find(&users)
// SELECT * FROM users WHERE age = 20;
```

### 永久删除

你可以使用 `Unscoped`来永久删除匹配的记录

```
db.Unscoped().Delete(&order)
// DELETE FROM orders WHERE id=10;
```

### 删除标志

默认情况下，`gorm.Model`使用`*time.Time`作为`DeletedAt` 的字段类型，不过软删除插件`gorm.io/plugin/soft_delete`同时也提供其他的数据格式支持

> **提示** 当使用DeletedAt创建唯一复合索引时，你必须使用其他的数据类型，例如通过`gorm.io/plugin/soft_delete`插件将字段类型定义为unix时间戳等等
>
> ```
> import "gorm.io/plugin/soft_delete"
> 
> type User struct {
>   ID        uint
>   Name      string                `gorm:"uniqueIndex:udx_name"`
>   DeletedAt soft_delete.DeletedAt `gorm:"uniqueIndex:udx_name"`
> }
> ```

#### Unix 时间戳

使用unix时间戳作为删除标志

```
import "gorm.io/plugin/soft_delete"

type User struct {
  ID        uint
  Name      string
  DeletedAt soft_delete.DeletedAt
}

// 查询
SELECT * FROM users WHERE deleted_at = 0;

// 软删除
UPDATE users SET deleted_at = /* current unix second */ WHERE ID = 1;
```

你同样可以指定使用毫秒 `milli`或纳秒 `nano`作为值，如下例：

```
type User struct {
  ID    uint
  Name  string
  DeletedAt soft_delete.DeletedAt `gorm:"softDelete:milli"`
  // DeletedAt soft_delete.DeletedAt `gorm:"softDelete:nano"`
}

// 查询
SELECT * FROM users WHERE deleted_at = 0;

// 软删除
UPDATE users SET deleted_at = /* current unix milli second or nano second */ WHERE ID = 1;
```

#### 使用 `1` / `0` 作为 删除标志

```
import "gorm.io/plugin/soft_delete"

type User struct {
  ID    uint
  Name  string
  IsDel soft_delete.DeletedAt `gorm:"softDelete:flag"`
}

// 查询
SELECT * FROM users WHERE is_del = 0;

// 软删除
UPDATE users SET is_del = 1 WHERE ID = 1;
```

#### 混合模式

混合模式可以使用 `0`，`1`或者unix时间戳来标记数据是否被软删除，并同时可以保存被删除时间

```go
type User struct {
  ID        uint
  Name      string
  DeletedAt time.Time
  IsDel     soft_delete.DeletedAt `gorm:"softDelete:flag,DeletedAtField:DeletedAt"` // use `1` `0`
  // IsDel     soft_delete.DeletedAt `gorm:"softDelete:,DeletedAtField:DeletedAt"` // use `unix second`
  // IsDel     soft_delete.DeletedAt `gorm:"softDelete:nano,DeletedAtField:DeletedAt"` // use `unix nano second`
}

// 查询
SELECT * FROM users WHERE is_del = 0;

// 软删除
UPDATE users SET is_del = 1, deleted_at = /* current unix second */ WHERE ID = 1;
```
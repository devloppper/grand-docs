# Docker安装MySQL

安装`MySQL:8`

1. **首先从DockerHub中拉取镜像**

```shell
docker pull mysql:8
```

官方的DockerHub拉取镜像缓慢，如果是Linux&amd64，可以使用如下镜像

```shell
docker pull registry.cn-chengdu.aliyuncs.com/h528/mysql:8
```

2. **创建日志目录和数据目录**

```shell
mkdir $DATA_DIR
mkdir $LOG_DIR
```

3. **启动容器**

```shell
docker run -d \
	--name mysql \
	-p 3306[宿主机]:3306[容器] \
	-v $DATA_DIR:/var/lib/mysql \
	-v $LOG_DIR:/var/log/mysql \
	-e TZ=Asiz/Shanghai \
	-e MYSQL_ROOT_PASSWORD=xxxxxx \
	mysql:8 \
	--character-set-server=utf8mb4 \
	--collation-server=utf8mb4_general_ci
```

其中

`-e TZ` 是设置时区

`-e MYSQL_ROOT_PASSWORD`设置root账户的默认密码，当然host是`localhost`，如果需要将host设置成`%`，那么需要进入容器，进行相关的操作。

4. **进入容器**

```shell
docker exec -it mysql /bin/sh
> mysql -u root -p
```




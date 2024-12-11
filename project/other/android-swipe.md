# 安卓手机自动划屏设置

## 下载ADB

主要实现原理是利用android手机调试以及**ADB**，因此需要先下载ADB。

最新版本可以在android[官网](https://developer.android.google.cn/?hl=zh-cn)下载，下载速度缓慢，也可以点击如下对应平台下载。

[**Windows**](https://fs.hujye.com/android/platform-tools-windows.zip)

[**MacOS**](https://fs.hujye.com/android/platform-tools-darwin.zip)

以MacOS为例，下载完解压后，目录如下

```shell
> ls -lh
total 33008
-rw-r--r--@ 1 jayhoo  staff   1.1M  1  1  2008 NOTICE.txt
-rwxr-xr-x@ 1 jayhoo  staff   7.6M  1  1  2008 adb
-rwxr-xr-x@ 1 jayhoo  staff   298K  1  1  2008 etc1tool
-rwxr-xr-x@ 1 jayhoo  staff   2.4M  1  1  2008 fastboot
-rwxr-xr-x@ 1 jayhoo  staff    13K  1  1  2008 hprof-conv
drwxr-xr-x@ 3 jayhoo  staff    96B  9 18 17:10 lib64
-rwxr-xr-x@ 1 jayhoo  staff   258K  1  1  2008 make_f2fs
-rwxr-xr-x@ 1 jayhoo  staff   258K  1  1  2008 make_f2fs_casefold
-rwxr-xr-x@ 1 jayhoo  staff   968K  1  1  2008 mke2fs
-rw-r--r--@ 1 jayhoo  staff   1.1K  1  1  2008 mke2fs.conf
-rw-r--r--@ 1 jayhoo  staff    38B  1  1  2008 source.properties
-rwxr-xr-x@ 1 jayhoo  staff   3.3M  1  1  2008 sqlite3
```

我们要用的是`adb`，在Windows平台下叫做`adb.exe`。

如果有必要，可以将`adb`添加到对应系统的环境变量中，因此后续还有些操作需要。

### ADB的一些功能

1. **获取连接中设备（USB和无线）**

   ```shell
   adb devices
   ```

2. **划动屏幕指令**

   ```shell
   adb -s <设备号> shell input swipe fromX fromY toX toY
   ```



### 开启手机USB调试

首先将手机通过数据线连接在电脑上。

不同手机可能开启`开发者模式`的方式不尽相同，通用的都是连续点击**关于手机**>> **版本号**，具体差异网络上搜索。

开启开发者模式后，继续开启USB调试，然后执行`adb devices`获取设备号。



### 启动刷屏程序

划屏的主要逻辑就是通过ADB的划动屏幕指令实现的，任何语言都可以，如下提供Python的demo

```python
import random
import subprocess
import time

# 这里是下载的adb路径
abd_path = "/Users/jayhoo/Library/Android/sdk/platform-tools/adb"

subprocess.getoutput(f"{abd_path} start-server")


# 	上下划动
def swipe(url="", _from=300, to=20, duration=100):
    if len(url) > 0:
        # subprocess.getoutput(f"{abd_path} -s {url} shell input swipe 100 {_from} 100 {to} {duration}")
        subprocess.getoutput(f"{abd_path} -s {url} shell input swipe 600 {_from} 600 {to} {duration}")


def swipeLeft(url="", _from=300, to=20, duration=100):
    if len(url) > 0:
        # subprocess.getoutput(f"{abd_path} -s {url} shell input tap 400 700")
        subprocess.getoutput(f"{abd_path} -s {url} shell input swipe 400 {_from} 400 {to} {duration}")


def swipeRight(url="", _from=300, to=20, duration=100):
    if len(url) > 0:
        # subprocess.getoutput(f"{abd_path} -s {url} shell input tap 1200 400")
        subprocess.getoutput(f"{abd_path} -s {url} shell input swipe 1200 {_from} 1200 {to} {duration}")


#	 水平划动
def sider(url="", _from=500, to=300, duration=100):
    if len(url) > 0:
        subprocess.getoutput(f"{abd_path} -s {url} shell input swipe  {_from} 500 {to} 500 {duration}")


# 	设备号
urls = ["64030944"]

count = 0

while True:
    # 我这里每滚动20次，重新连接urls里面的设备号
    if count % 20 == 0:
        for url in urls:
            subprocess.getoutput(f"{abd_path} connect {url}")

    # 随机间隔时间
    v = random.randint(300, 400)
    for url in urls:
        # 具体划动方式可以自己设置
        swipe(url, v + 230, v, v)
    stime = random.randint(3, 5)
    print(f"see {stime}s")
    count += 1

```


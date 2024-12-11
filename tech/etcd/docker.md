# 使用Docker安装etcd

安装`etcd:3.5.12`

1. **拉取镜像地址**

官方的DockerHUB的镜像仓库地址为

```shell
docker pull quay.io/coreos/v3.5.12
```

如果拉取较慢，可以使用如下镜像地址

```shell
docker pull registry.cn-chengdu.aliyuncs.com/h528/etcd:v3.5.12
```

2. **创建数据目录**

```shell
mkdir &DATA_DIR
```

3. 创建配置文件

```shell
mkdir -p $CONFIG_DIR && cd $CONFIG_DIR
touch conf.yml
```

> conf.yml 的主要内容如下
>
> name: etcd-3
> data-dir: /var/etcd/data
> listen-client-urls: http://0.0.0.0:2379
> advertise-client-urls: http://192.168.9.83:2379
> listen-peer-urls: http://0.0.0.0:2380
> initial-cluster-token: etcd-cluster
> initial-cluster-state: new
> logger: zap
> log-level: info

其中要注意，数据目录设置后，要和Docker容器启动挂载目录对应，也就是宿主机器的`$DATA_DIR`。

4. **启动容器**

```shell
docker run -d \
        --name etcd \
        -e ETCD_ROOT_PASSWORD=****** \
        -v $CONFIG_DIR/conf.yml:/var/lib/etcd/conf/etcd/conf.yml \
        -v $DATA_DIR:/var/etcd/data \
        -p 2390:2379 \
        --restart=always \
        registry.cn-chengdu.aliyuncs.com/h528/etcd:v3.5.12 /usr/local/bin/etcd --config-file=/var/lib/etcd/conf/etcd/conf.yml
```

`-e ETCD_ROOT_PASSWORD` 指定etcd的root密码，但etcd默认并未开启auth。

`-v`数据目录和配置文件的挂载，实际部署时，需要更换为对应机器的目录。

`--restart=always` 容器异常退出时，总是默认重启。

`/usr/local/bin/etcd --config-file=/var/lib/etcd/conf/etcd/conf.yml` 指定配置文件启动etcd。



5. **开启认证**

此版本的镜像启动的容器，并不能进入容器，而将`etcdctl`进行了暴露。因此，如果我们需要配置etcd或者获取数据之类的，直接执行如下命令

```shell
docker exec -it etcd etcdctl xxx
```

那么，开启认证的操作如下

```shell
docker exec -it etcd etcdctl auth enable
```

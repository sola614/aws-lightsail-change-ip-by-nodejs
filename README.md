# aws-lightsail-change-ip
nodejs端使用aws lightsail sdk定时检查ip，如果被阻断则自动更换，请部署在国内，放在国外无法批量检测
## 使用
1、安装nodejs环境和pm2命令(这里用nvm来进行安装管理nodejs)
```
wget -qO- https://raw.github.com/creationix/nvm/master/install.sh | sh
reboot
nvm install 16
npm i pm2 -g
```
2、下载
```
git clone https://github.com/sola614/aws-lightsail-change-ip.git
```
3、运行
```
npm run build
```
## 注意
1、自行[申请](https://console.aws.amazon.com/iam/home?region=ap-northeast-1#/security_credentials)aws的credentials(访问密钥)填入index对应位置  
2、部署在国内服务器上才能有效检测ip连通性

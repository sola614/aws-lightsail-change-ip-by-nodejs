const {
  LightsailClient,
  GetInstancesCommand,
  AttachStaticIpCommand, //绑定静态ip
  DetachStaticIpCommand, //解绑静态ip
  ReleaseStaticIpCommand, //删除静态ip
  GetStaticIpsCommand, //获取区域所有静态ip列表
  AllocateStaticIpCommand, //创建静态ip
} = require("@aws-sdk/client-lightsail");

const net = require("net");
//region
// US East (Ohio) (us-east-2)
// US East (N. Virginia) (us-east-1)
// US West (Oregon) (us-west-2)
// Asia Pacific (Mumbai) (ap-south-1)
// Asia Pacific (Seoul) (ap-northeast-2)
// Asia Pacific (Singapore) (ap-southeast-1)
// Asia Pacific (Sydney) (ap-southeast-2)
// Asia Pacific (Tokyo) (ap-northeast-1)
// Canada (Central) (ca-central-1)
// EU (Frankfurt) (eu-central-1)
// EU (Ireland) (eu-west-1)
// EU (London) (eu-west-2)
// EU (Paris) (eu-west-3)
// EU (Stockholm) (eu-north-1)
const regions = ["ap-northeast-1"];
const credentials = {
  accessKeyId: "",
  secretAccessKey: "",
};
const clients = [];
regions.map((region) => {
  clients.push(
    new LightsailClient({
      region,
      credentials,
    })
  );
});
const min = 60; //间隔分钟数,默认60
const port = 22; //ip连通性检查端口，默认22

function getInstances(params) {
  console.log("获取服务器列表中");
  const command = new GetInstancesCommand({});
  clients.map(async (client) => {
    const response = await client.send(command);

    const servers = response.instances;
    // console.log(servers);
    if (Array.isArray(servers)) {
      servers.map((server) => {
        // getStaticIp(client);
        checkIp(client, server);
      });
    }
  });
}
async function checkIp(client, server) {
  // isStaticIp 是否是静态ip publicIpAddress 公共ip
  console.log("正在检查ip连通性");

  const host = server.publicIpAddress;
  const netClient = net.createConnection(
    {
      port, // 端口
      host, // 服务地址，默认localhost
    },
    () => {
      console.log(`${host}可连接，无需变更`);
      netClient.destroy();
    }
  );
  netClient.setTimeout(3000); //设置3s超时时长
  netClient.on("timeout", (err) => {
    //设定时间后超时直接认为ip阻断
    netClient.destroy();
    if (server.isStaticIp) {
      getStaticIp(client, server);
    } else {
      allocateStaticIp(client, server);
      //
    }
  });
  netClient.on("error", (err) => {
    console.log(`${host}连接超时`);
    // netClient.destroyed();
    if (server.isStaticIp) {
      getStaticIp(client, server);
    } else {
      allocateStaticIp(client, server);
      //
    }
    // attachStaticIp(client, server);
  });
}
async function getStaticIp(client, server) {
  console.log("正在获取区域所有静态ip列表");
  const command = new GetStaticIpsCommand({});
  const response = await client.send(command);
  const staticIps = response.staticIps;
  console.log("获取区域所有静态ip列表成功");
  if (Array.isArray(staticIps)) {
    const activeStaticIpItem = staticIps.find((item) => {
      return item.ipAddress === server.publicIpAddress;
    });
    detachStaticIp(client, activeStaticIpItem);
  }
}
async function detachStaticIp(client, activeStaticIpItem) {
  console.log(
    `正在解绑静态ip:${activeStaticIpItem.name} ${activeStaticIpItem.ipAddress}`
  );
  const command = new DetachStaticIpCommand({
    staticIpName: activeStaticIpItem.name,
  });
  await client.send(command);
  console.log(`解绑成功`);
  releaseStaticIp(client, activeStaticIpItem);
}
async function releaseStaticIp(client, staticIpItem) {
  console.log(`正在删除静态ip:${staticIpItem.name} ${staticIpItem.ipAddress}`);
  const command = new ReleaseStaticIpCommand({
    staticIpName: staticIpItem.name,
  });
  await client.send(command);
  console.log("删除静态ip成功");
}
async function allocateStaticIp(client, server) {
  console.log(`正在创建新的静态ip`);
  const staticIpName = `StaticIp-${Math.random()}`;
  const command = new AllocateStaticIpCommand({ staticIpName });
  await client.send(command);
  console.log("创建静态ip成功！");
  server.newStaticIpName = staticIpName;
  attachStaticIp(client, server);
}
//绑定静态ip
async function attachStaticIp(client, server) {
  console.log(
    `正在把新静态ip${server.newStaticIpName}绑定到实例${server.name}`
  );
  const command = new AttachStaticIpCommand({
    instanceName: server.name,
    staticIpName: server.newStaticIpName,
  });
  await client.send(command);
  console.log("绑定新ip成功！");
}
getInstances();
clearInterval(timer);
var timer = setInterval(() => {
  getInstances();
}, min * 60 * 1000);

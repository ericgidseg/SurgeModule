# IP Purity Surge Module

这是一个 Surge Panel 模块，用来展示当前出口 IP 的基础纯净度信息：风险评分、位置、ASN、网络类型和脱敏后的 IP 地址。

## 安装

1. 将 `IP-Purity.sgmodule` 导入 Surge。
2. 在 Surge 的模块列表中启用 **IP Purity**。
3. 在面板中打开 **IP Purity**。模块默认每 10 分钟更新一次。

远程模块地址：`https://raw.githubusercontent.com/ericgidseg/SurgeModule/main/IP-Purity.sgmodule?v=c68bc7a`

数据来自 IPPure 官方公开接口 `https://my.ippure.com/v1/info`。风险分数直接使用接口返回的 `fraudScore`，网络类型使用 `isResidential` 和 `isBroadcast` 字段判断。

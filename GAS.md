GAS:
可用 : queryAccountBalances（）；
总的 ：可用 + lookupBlockRewardsById 请求数据中的 return_cash字段
可领取 lookupBlockRewardsById 请求数据 available_balance 中的amount字段
立即领取：claimVestingBalance接口；


正在赎回 : 查询账户信息中的 cashback_vb 字段  ---> get_objects();
抵押中：通过GAS余额/抵押率 计算出的;
抵押率: 通过预估GAS计算;
预估GAS : queryGas()


抵押
updateCollateralForGas（）
抵押数量必须大于0；
实际抵押数量是：抵押 + 输入的数量；


赎回
updateCollateralForGas()
接口实际数量 = 抵押数量 - 用户输入数量
输入数量 > 大于抵押数量 前端控制;




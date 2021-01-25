import {
  Message
} from "element-ui";

// import BCX from 'bcx-api'
import "./bcx.min"
import {
  cacheSession,
  cacheKey
} from "./Utils"
import {
  langEn
} from "../src/common/lang/en.js"
import {
  langZh
} from "../src/common/lang/zh.js"
// import {
//   Loading
// } from 'element-ui'
import { Loading, Indicator } from "mint-ui";
import axios from 'axios'

let bcx = null



// 浏览器插件链接 当前请求秒数
let requestSeconds = 0

// 浏览器插件链接 请求最大秒数
let requestSecondsMax = 7

let promiseObjArr = []


// bcx对象初始化
// export let initBcx = function () {

//   cacheSession.remove(cacheKey.accountName)
  
  
//   var _configParams={ 
//     ws_node_list:[
//         {url:"ws://test.cocosbcx.net",name:"Cocos - China - Beijing"},   
//     ],
//     networks:[
//         {
//             core_asset:"COCOS",
//             chain_id:"c1ac4bb7bd7d94874a1cb98b39a8a582421d03d022dfa4be8c70567076e03ad0" 
//         }
//     ], 
//     faucet_url: "http://test-faucet.cocosbcx.net",
//     auto_reconnect:true,
//     real_sub:true,
//     check_cached_nodes_data:false
// };
//   bcx = new BCX(_configParams);
// }

// bcx对象初始化
export let initBcx = function () {
  return new Promise(function (resolve, reject) {
    axios
    .get("https://api-cocosbcx.cocosbcx.net/backend/getParams")
    .then(response => {
      // nodes = response.data.data;
      let nodes = response.data.data.filter(( item )=>{
        return item.name == 'Main'
      })
        var _configParams={ 
          ws_node_list:[
              {url:nodes[0].ws,name:nodes[0].name},   
          ],
          networks:[
              {
                  core_asset:"COCOS",
                  chain_id: nodes[0].chainId 
              }
          ], 
          faucet_url: nodes[0].faucetUrl,
          auto_reconnect:true,
          real_sub:true,
          check_cached_nodes_data:false
      };
    //   var _configParams={ 
    //     ws_node_list:[
    //         {url:"ws://192.168.90.46:8049",name:"personnaliser"},   
    //     ],
    //     networks:[
    //         {
    //             core_asset:"COCOS",
    //             chain_id: "bc741ab76f35c22fb3e3b51cd70dcdf38db63e283229534ee2e5cf1e7a6c994b" 
    //         }
    //     ], 
    //     faucet_url: nodes[0].faucetUrl,
    //     auto_reconnect:true,
    //     real_sub:true,
    //     check_cached_nodes_data:false
    // };
      bcx = new BCX(_configParams);
      resolve(true)
    })
    .catch(function (error) {
      console.log(error);
    });
  })
  
}


// 浏览器插件链接
export let browserConnect = function () {
  let currentTimer = null
  return new Promise(function (resolve, reject) {
    if (window.BcxWeb) {
      bcx = window.BcxWeb
      resolve(true)
      return false
    } else {
      currentTimer = setInterval(() => {
        if (window.BcxWeb) {
          Indicator.close();
          bcx = window.BcxWeb
          clearInterval(currentTimer)
          resolve(true)
          return false
        }
        requestSeconds++
        if (requestSeconds >= requestSecondsMax) {
          Indicator.close();
          clearInterval(currentTimer)

          let tipsMessage = {}
          // if (cacheSession.get(cacheKey.lang) == 'zh') {
          //   tipsMessage = langZh.tipsMessage
          // } else {
          //   tipsMessage = langEn.tipsMessage
          // }
          console.log("-----    window.BcxWeb   Failure -------")
          // Message({
          //   duration: 2000,
          //   message: tipsMessage.common.linkFailure,
          //   type: 'error',
          // })
          
          resolve(false)
          return false
        }
      }, 1000)
    }

  })
}



export let initConnect = function () {
  
  return new Promise(async function (resolve, reject) {
    
    bcx.initConnect().then( res => {
        bcx = {}
        var _configParams={
          ws_node_list:[
              {url:res.ws,name:res.name},   
          ],
          networks:[
              {
                  core_asset:"COCOS",
                  chain_id: res.chainId 
              }
          ], 
          faucet_url: res.faucetUrl,
          auto_reconnect:true,
          real_sub:true,
          check_cached_nodes_data:false
      }
      bcx = new BCX(_configParams);
      resolve(true)
    })
  })
}


// 获取语言
export let walletLanguage = function () {
  
  return new Promise( function (resolve, reject) {
    console.log('****************************')
    bcx.walletLanguage().then( res => {
      console.log('****************************')
      console.log(res)
      resolve(res)
    }).catch( err => {
      console.log(err)
    })
  })
}


// 获取用户信息
export let getAccountInfo = function () {
  // let loadingInstance = Loading.service();
  Indicator.open({
    spinnerType: "fading-circle"
  });
  return new Promise( (resolve, reject) => {
    // let browserConnectResult = await browserConnect()
    // if (!browserConnectResult) {
    //   Indicator.close();
    //   return false
    // }
    browserConnect().then( (browserConnectResult) => {
      if (!browserConnectResult) {
        Indicator.close();
        return false
      } else {
        bcx.getAccountInfo().then(res => {
          Indicator.close();
          if (res.locked) {
            let tipsMessage = {}
            if (cacheSession.get(cacheKey.lang) == "zh") {
              tipsMessage = langZh.tipsMessage
            } else {
              tipsMessage = langEn.tipsMessage
            }
            Message({
              duration: 2000,
              message: tipsMessage.common.accountLocked,
              type: "error",
            })
            resolve(false)
            return false
          } else {
            cacheSession.set(cacheKey.accountName, res.account_name)
            cacheSession.remove(cacheKey.myWorldView)
            resolve(res)
            return false
          }
        }).catch(err => {
          
          Indicator.close();
          console.log("----------browserConnectResult------err--------")
          console.log(err)
          reject(err)
        })
      }
    })
  })
}




// 查询账户信息
export let queryAccountInfo = function () {
  return new Promise(function (resolve, reject) {
    Indicator.open({
      spinnerType: "fading-circle"
    });
    getAccountInfo().then(getAccountInfoResult => {
      if (!getAccountInfoResult) return false

      bcx.queryAccountInfo({
        account: getAccountInfoResult[cacheKey.accountName] || ''
      }).then(res=>{
        Indicator.close();
        resolve(res)
      }).catch(err=>{
        Indicator.close();
        console.log('--------err-------')
        console.log(err)
      })
    })
  })
}

// 查询数据通过id
export let queryDataByIds = function (ids) {
  Indicator.open({
    spinnerType: "fading-circle"
  });
  return new Promise(function (resolve, reject) {
    bcx.queryDataByIds({
        ids: ids
    }).then(res=>{
      Indicator.close();
      resolve(res)
    }).catch(err=>{
      Indicator.close();
      console.log(err)
    })
  })

}



// 查询账户指定资产余额
export let queryAccountBalances = function (account) {
  
  Indicator.open({
    // text: '加载中...',
    spinnerType: "fading-circle"
  });
  return new Promise(function (resolve, reject) {
    getAccountInfo().then( (getAccountInfoResult) => {
      if (!getAccountInfoResult) return false
      
      bcx.queryAccountBalances({
        account: getAccountInfoResult[cacheKey.accountName] || ''
      }).then(res => {
        // loadingInstance.close();
        Indicator.close();
        resolve(res)
        // console.info("bcx passwordLogin res", res);
      }).catch(err => {
        console.log(err)
        Indicator.close();
        resolve(false)
      })
    })
    
  })
}




// 查看账户节点出块奖励
export let lookupBlockRewards = function (account) {
  
  Indicator.open({
    spinnerType: "fading-circle"
  });
  return new Promise(function (resolve, reject) {
      
      bcx.lookupBlockRewards().then(res => {
        Indicator.close();
        resolve(res)
      }).catch(err => {
        console.log(err)
        Indicator.close();
        resolve(false)
      })
    
  })
}



export let lookupBlockRewardsById =  function () {
  Indicator.open({
    spinnerType: 'fading-circle'
  });
  return new Promise(async function (resolve, reject) {
    getAccountInfo().then( getAccountInfoResult => {
      if (!getAccountInfoResult) return false
      bcx.lookupBlockRewardsById({
        account_id: getAccountInfoResult[cacheKey.accountId]
      }).then(res => {
        Indicator.close();
        resolve(res)
      }).catch(err=>{
        Indicator.close();
        console.log('--------err-------')
        console.log(err)
      })
    } )
  })
}


// 预估获得gas

export let queryGas =  function (amount) {
  Indicator.open({
    spinnerType: 'fading-circle'
  });
  return new Promise(function (resolve, reject) {
    bcx.queryGas({
      amount: amount
    }).then( res => {
      Indicator.close();
      resolve(res)
    })
  })
}



// GAS抵押
export let updateCollateralForGas = function (params) {
  Indicator.open({
    spinnerType: 'fading-circle'
  });
  return new Promise(function (resolve, reject) {
    bcx.updateCollateralForGas({
        // 抵押人
        mortgager: params.mortgager,
        // 受益人
        beneficiary: params.beneficiary,
        // 抵押数量  COCOS
        amount: params.amount,
        // 是否是提议
        isPropose: params.isPropose
    }).then(res=>{
      Indicator.close();
      resolve(res)
    }).catch( err => {
      Indicator.close();
      console.log('------updateCollateralForGas-----err-----------')
      console.log(err)
    })
  })

}



// 查询账户
export let queryVestingBalance = async function (account) {
  Indicator.open({
    spinnerType: 'fading-circle'
  });
  return new Promise(function (resolve, reject) {
    getAccountInfo().then( getAccountInfoResult => {
      if (!getAccountInfoResult) return false
      bcx.queryVestingBalance({
        account: getAccountInfoResult[cacheKey.accountName]
      }).then(res => {
        Indicator.close();
        resolve(res)
      }).catch(err=>{
        Indicator.close();
        console.log('--------err-------')
        console.log(err)
      })
    })
  })
}

// 立即领取
export let claimVestingBalance = function (id) {
  return new Promise(function (resolve, reject) {
    
      Indicator.open({
        spinnerType: 'fading-circle'
      });
      bcx.claimVestingBalance({
        id: id
      }).then(res=>{
        Indicator.close();
        resolve(res)
      }).catch(err=>{
        Indicator.close();
        console.log('--------err-------')
        console.log(err)
      })
    })
      
}

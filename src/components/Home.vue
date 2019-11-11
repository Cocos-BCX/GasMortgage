<template>
  <div class="home">
    <div class="center-container">
      <div class="available-GAS">
        <p class="title">GAS</p>
        <div class="available-bar">可用：{{myAvailableGAS}} GAS / {{totalGAS}} GAS</div>
        <p class="receive-title">可领取GAS：</p>
        <div class="receive-content">
          <p class="num">{{receiveGAS}}</p>
          <p class="unit">GAS</p>
        </div>
        <a href="javascript:void(0);" class="collect-immediately-btn" @click="claimVestingBalanceAjax()">立即领取</a>
      </div>

      <div class="cocos-container">
        <div class="title">COCOS</div>
        <div class="redeem-info">
          <div>
            <p class="tit">赎回中：</p>
            <ul class="receive-content">
              <li class="num">{{redeemAsset}}</li>
              <li class="unit">COCOS</li>
            </ul>
          </div>
          <div>
            <p class="tit">已抵押：</p>
            <ul class="receive-content">
              <li class="num">{{mortgageAsset}}</li>
              <li class="unit">COCOS</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="redeem-tab-container">
        <ul class="tab-btn-bar">
          <li @click="changeIsMortgage(true)">
            <img v-if="isMortgage" src="../assets/images/circle.png" alt="">
            <img v-if="!isMortgage" src="../assets/images/nochoice.png" alt="">
            <span>抵押</span>
          </li>
          <li @click="changeIsMortgage(false)">
            <img v-if="!isMortgage" src="../assets/images/circle.png" alt="">
            <img v-if="isMortgage" src="../assets/images/nochoice.png" alt="">
            <span>赎回</span>
          </li>
        </ul>
        
        <div class="balance">
          <p>余额：{{myCOCOS}} COCOS</p>
          <!-- <p class="rental-list">租借列表</p> -->
        </div>
        <div class="GAS-mortgage-title">GAS 抵押</div>
        <div class="mortgage-num">
          <input type="text" placeholder="抵押 COCOS 数量" v-model="mortgageCOCOSAmount">
          <p>≈ {{conversionGAS}} GAS</p>
        </div>

        <div class="receiving-account-bar">
          <div class="title">
            <!-- <ul>接收账号</ul> -->
            <ul>取回账号</ul>
            <ul class="tab">
              <li @click="changeIsSelf(true)">
                <img v-if="isSelf" src="../assets/images/circle.png" alt="">
                <img v-if="!isSelf" src="../assets/images/nochoice.png" alt="">
                <span>自己</span>
              </li>
              <li @click="changeIsSelf(false)">
                <img v-if="!isSelf" src="../assets/images/circle.png" alt="">
                <img v-if="isSelf" src="../assets/images/nochoice.png" alt="">
                <span>他人</span>
              </li>
            </ul>
          </div>
          <input v-if="!isSelf" class="receiverGASaccount" type="text" v-model="receiverGASaccount" placeholder="请输入">
        </div>
        
      </div>

      <div class="next" @click="updateCollateralForGasAjas()">下一步</div>
    </div>
  </div>
</template>


<script>
import {
  queryAccountBalances,
  lookupBlockRewardsById,
  queryDataByIds,
  getAccountInfo,
  queryVestingBalance,
  queryGas,
  updateCollateralForGas,
  claimVestingBalance
} from "../../libs/bcx.api";
import { cacheSession, cacheKey } from "../../libs/Utils"
import { Indicator, Toast } from "mint-ui";
export default {
  data() {
    return {
      myCOCOS: '',
      myAvailableGAS: '',
      receiveGAS: '',
      totalGAS: '',

      redeemAsset: '',
      mortgageAsset: '',

      isMortgage: true,

      receiverGASaccount: '',
      isSelf: true,
      mortgageCOCOSAmount: '',
      conversionGAS: '',

      asset_id: ''
    };
  },
  watch: {
    'mortgageCOCOSAmount': function (val) {
      let _this = this
      queryGas(val).then(res => {
        console.log('-----queryGas------res------')
        console.log(res)
        _this.conversionGAS = res.data.amount
      })
    }
  },
  mounted() {
    this.queryAccountBalancesAjax()
  },
  methods: {
    changeIsSelf(val){
      this.isSelf = val
    },
    changeIsMortgage(val){
      this.isMortgage = val
    },
    queryAccountBalancesAjax(){
      let _this = this
      _this.myCOCOS = ''
      _this.myAvailableGAS = ''
      queryAccountBalances().then( res => {
        console.log('---------queryAccountBalances-------------')
        console.log(res)
        if (res.code == 1) {
          _this.myCOCOS = res.data.COCOS
          _this.myAvailableGAS = res.data.GAS.toFixed(5)
          // _this.lookupBlockRewardsByIdAjax()
          _this.queryVestingBalanceAjax()
        }
      })
    },
    queryVestingBalanceAjax(){
      let _this = this
      _this.totalGAS = 0
      _this.receiveGAS = 0
      _this.asset_id = ''
      queryVestingBalance().then( res => {
        console.log('----------queryVestingBalance------------')
        console.log(res)
        if (res.code == 1) {

          for (let i = 0; i < res.data.length; i++) {
            if (res.data[i].type == "cashback_gas") {
              _this.totalGAS = (Number(_this.myAvailableGAS) + Number(res.data[i].return_cash)).toFixed(5)
              _this.receiveGAS = res.data[i].available_balance.amount
              _this.asset_id = res.data[i].id
              break;
            }
          }
          
          
          _this.queryGasAjax()
          _this.queryDataByIdsAjax()
        } else {

        }
      })
    },
    lookupBlockRewardsByIdAjax(){
      let _this = this
      _this.totalGAS = 0
      _this.receiveGAS = 0
      lookupBlockRewardsById().then( res => {
        if (res.code == 1) {
          _this.totalGAS = Number(_this.myAvailableGAS) + Number(res.data.return_cash)
          _this.receiveGAS = res.data.available_balance.amount
          
          _this.queryGasAjax()
          _this.queryDataByIdsAjax()
        }
      })
    },
    claimVestingBalanceAjax(){
      let _this = this
      claimVestingBalance(_this.asset_id).then( res=>{
        console.log('-----res--------claimVestingBalance---------')
          console.log(res)
        if (res.code == 1) {
          Toast({
            message: '领取成功',
            className: 'toast-style',
            duration: 2000
          });
        } else {
        
          console.log(res)
          Toast({
            message: '领取失败',
            className: 'toast-style',
            duration: 2000
          });
        }
        
        _this.queryAccountBalancesAjax()
      })
    },
    queryDataByIdsAjax(){
      let _this = this
      new Promise(function (resolve, reject) {
        getAccountInfo().then( getAccountInfoResult => {
          resolve(getAccountInfoResult)
        })
        
          
      }).then( getAccountInfoResult => {
        return new Promise(function (resolve, reject) {
          console.log(getAccountInfoResult[cacheKey.accountId])
          queryDataByIds([getAccountInfoResult[cacheKey.accountId]]).then( res => {
              if (res.code == 1) {
                resolve(res.data[0].cashback_vb)
              }
            })
          })
        }).then(cashback_vb => {
          if (cashback_vb) {
            
            return new Promise(function (resolve, reject) {
              console.log(cashback_vb)
              queryDataByIds([cashback_vb]).then( res => {
                if (res.code == 1) {
                  _this.redeemAsset = res.data[0].balance.amount
                  resolve(res.data[0].balance.asset_id)
                }
              })
            })
            
            }
          }).then( asset_id => {
            queryDataByIds([asset_id]).then( res => {
                if (res.code == 1) {
                  _this.redeemAsset =  Number(_this.redeemAsset)/Math.pow(10,res.data[0].precision);  
                }
              })
          })
    },
    queryGasAjax(){
      let _this = this
      queryGas(10).then(res => {
        console.log('-----queryGas------res------')
        console.log(res)
        _this.mortgageAsset = (_this.totalGAS/(res.data.amount/10)).toFixed(2)
      })
    },
    updateCollateralForGasAjas(){
      let _this = this
      if (_this.mortgageCOCOSAmount <= 0) {
        
        Toast({
          message: '抵押数量必须大于零',
          className: 'toast-style',
          duration: 2000
        });
        return false
      }
      if (this.isSelf) {
        new Promise(function (resolve, reject) {
          getAccountInfo().then( getAccountInfoResult => {
            resolve(getAccountInfoResult)
          })
        }).then( getAccountInfoResult=>{
          let amount = 0
          if (_this.isMortgage) {
            amount = Number(_this.mortgageCOCOSAmount) + Number(_this.mortgageAsset)
          } else {
            amount = Number(_this.mortgageAsset) - Number(_this.mortgageCOCOSAmount)
          }
          updateCollateralForGas({
            // 抵押人
            mortgager: getAccountInfoResult[cacheKey.accountName],
            // 受益人
            beneficiary: _this.isSelf?getAccountInfoResult[cacheKey.accountName]:_this.receiverGASaccount,
            // 抵押数量  COCOS
            amount: amount,
            // 是否是提议
            isPropose: false
          }).then(res=>{
            console.log('updateCollateralForGasAjas-----------------res')
            console.log(res)
            if (res.code == 1) {
              Toast({
                message: '成功',
                className: 'toast-style',
                duration: 2000
              });
            } else {
              
              Toast({
                message: '失败',
                className: 'toast-style',
                duration: 2000
              });
            }
            _this.receiverGASaccount = ''
            _this.queryAccountBalancesAjax()
          })
        })
      } else {
         let amount = 0
        if (_this.isMortgage) {
          amount = Number(_this.mortgageCOCOSAmount) + Number(_this.mortgageAsset)
        } else {
          amount = Number(_this.mortgageCOCOSAmount)
        }
        updateCollateralForGas({
          // 抵押人
          mortgager: _this.receiverGASaccount,
          // 受益人
          beneficiary: _this.isSelf?getAccountInfoResult[cacheKey.accountName]:_this.receiverGASaccount,
          // 抵押数量  COCOS
          amount: amount,
          // 是否是提议
          isPropose: false
        }).then(res=>{
          console.log('updateCollateralForGasAjas-----------------res')
          console.log(res)
            if (res.code == 1) {
              Toast({
                message: '成功',
                className: 'toast-style',
                duration: 2000
              });
            } else {
              
              Toast({
                message: '失败',
                className: 'toast-style',
                duration: 2000
              });
            }
            _this.receiverGASaccount = ''
          _this.queryAccountBalancesAjax()
        })
      }
      
    }

  }
};
</script>



<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.available-GAS{
  width: 100%;
  height: 1.55rem;
  background: #fff;
  border-radius: 0.08rem;
  padding-left: 0.15rem;
  padding-right: 0.15rem;
  margin-top: 0.15rem;
  position: relative;
}
.available-GAS .title{
  width: 100%;
  height: 0.48rem;
  line-height: 0.52rem;
  font-size: 0.16rem;
  font-weight:500;
  color:rgba(38,42,51,1);
}
.available-GAS .available-bar{
  width: 100%;
  height: 0.28rem;
  line-height: 0.3rem;
  text-align: center;
  background:linear-gradient(270deg,rgba(35,167,255,1) 0%,rgba(27,94,255,1) 100%);
  border-radius:0.04rem;
  font-weight:400;
  color:rgba(255,255,255,1);
}
.available-GAS .receive-title{
  width: 100%;
  height: 0.18rem;
  font-size:12px;
  font-weight:500;
  color:rgba(38,42,51,1);
  line-height: 0.18rem;
  margin-top: 0.14rem;
  text-align: left;
}
.available-GAS .receive-content{
  height: 0.24rem;
  font-size: 0.2rem;
  font-weight:bold;
  color:rgba(38,42,51,1);
  line-height: 0.24rem;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-items: flex-end;
}
.available-GAS .receive-content .num{
  height: 0.24rem;
  font-size: 0.2rem;
  font-weight:bold;
  color:rgba(38,42,51,1);
  line-height: 0.24rem;
}
.available-GAS .receive-content .unit{
  height: 0.18rem;
  font-size: 0.12rem;
  font-weight:400;
  color:rgba(38,42,51,1);
  line-height: 0.18rem;
  margin-left: 0.06rem;
}
.available-GAS .collect-immediately-btn{
  display: block;
  width: 0.79rem;
  height: 0.28rem;
  line-height: 0.28rem;
  text-align: center;
  border-radius: 0.14rem;
  border:1px solid rgba(0,122,255,1);
  font-size: 0.12rem;
  font-weight:400;
  color:rgba(0,122,255,1);
  position: absolute;
  right: 0.15rem;
  bottom: 0.25rem;
}

.cocos-container {
  width: 100%;
  height: 1.18rem;
  line-height: 1.18rem;
  margin-top: 0.18rem;
  border-radius: 0.08rem;
  padding-left: 0.15rem;
  padding-right: 0.15rem;
  background: #fff;
}
.cocos-container .title{
  width: 100%;
  height: 0.53rem;
  line-height: 0.53rem;
  font-size: 0.16rem;
  font-weight:500;
  color:rgba(38,42,51,1);
  text-align: left;
}
.redeem-info{
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.redeem-info div {
  width: 50%;
  height: 0.45rem;
}
.redeem-info div .tit {
  width: 100%;
  height: 0.18rem;
  line-height: 0.18rem;
  font-size: 0.12rem;
  font-weight:500;
  color:rgba(38,42,51,1);
}
.redeem-info div:nth-child(1){
  border-right: 1px solid rgba(214,215,216,1);
  padding-left: 0.18rem;
}
.redeem-info div:nth-child(2){
  padding-left: 0.33rem;
}
.redeem-info div .receive-content{
  height: 0.24rem;
  font-size: 0.2rem;
  font-weight:bold;
  color:rgba(38,42,51,1);
  line-height: 0.24rem;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-items: flex-end;
}
.redeem-info div .receive-content .num{
  height: 0.24rem;
  font-size: 0.2rem;
  font-weight:bold;
  color:rgba(38,42,51,1);
  line-height: 0.24rem;
}
.redeem-info div .receive-content .unit{
  height: 0.18rem;
  font-size: 0.12rem;
  font-weight:400;
  color:rgba(38,42,51,1);
  line-height: 0.18rem;
  margin-left: 0.06rem;
}

.redeem-tab-container{
  width: 100%;
  margin-top: 0.18rem;
  border-radius: 0.08rem;
  padding-left: 0.15rem;
  padding-right: 0.15rem;
  background: #fff;
}
.redeem-tab-container .tab-btn-bar{
  width: 100%;
  height: 0.64rem;
  line-height: 0.64rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.redeem-tab-container .tab-btn-bar li{
  cursor: pointer;
  width: 50%;
  height: 0.64rem;
  line-height: 0.64rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.16rem;
  font-weight: 500;
  color:rgba(38,42,51,1);
}
.redeem-tab-container .tab-btn-bar li img{
  width: 0.2rem;
  height: 0.2rem;
}
.redeem-tab-container .tab-btn-bar li span{
  margin-left: 0.14rem;
  height: 0.22rem;
  line-height: 0.22rem;
  font-size: 0.16rem;
  font-weight:500;
  color:rgba(38,42,51,1);
}
.redeem-tab-container .balance{
  width: 100%;
  height: 0.34rem;
  line-height: 0.2rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(38,42,51,1);
  text-align: left;
  padding-bottom: 0.14rem;
  border-bottom: 1px solid rgba(230,230,230,1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.redeem-tab-container .balance .rental-list {
  height: 0.2rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(0,122,255,1);
  line-height: 0.2rem;
}
.GAS-mortgage-title{
  width: 100%;
  height: 0.2rem;
  line-height: 0.2rem;
  font-size: 0.14rem;
  font-weight: 400;
  color:rgba(38,42,51,1);
  margin-top: 0.15rem;
}
.mortgage-num {
  width: 100%;
  margin-top: 0.05rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mortgage-num input {
  width: 50%;
  height: 0.34rem;
  line-height: 0.34rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(165,169,177,1);
}
.mortgage-num p{
  height: 0.34rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(165,169,177,1);
  line-height: 0.2rem;
  padding-bottom: 0.14rem;
  border-bottom: 1px solid rgba(230,230,230,1);
}
.receiving-account-bar .title{
  width: 100%;
  height: 0.5rem;
  line-height: 0.5rem; 
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.receiving-account-bar ul.tab{
  width: 1.2rem;
  height: 0.2rem;
  line-height: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

}
.receiving-account-bar ul.tab img{
  width: 0.2rem;
  height: 0.2rem;
}
.receiving-account-bar ul.tab li {
  width: 0.53rem;
  height: 0.2rem;
  line-height: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.receiving-account-bar ul.tab li span{
  
  height:21px;
  font-size:15px;
  font-weight:400;
  color:rgba(165,169,177,1);
}
.receiving-account-bar ul.tab li.active span{
  color: #4E6ADC;
}
.receiverGASaccount{
  height: 0.2rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(165,169,177,1);
  line-height: 0.2rem;
  padding-bottom: 0.14rem;
}
.next {
  margin: 0.56rem auto 0;
  display: block;
  width: 100%;
  height: 0.5rem;
  line-height: 0.5rem;
  text-align: center;
  background:linear-gradient(112deg,rgba(100,103,207,1) 0%,rgba(72,107,224,1) 100%);
  border-radius: 0.06rem;
  filter:blur(0px);
  font-size: 0.16rem;
  font-weight:400;
  color:rgba(255,255,255,1);
}
</style>





<template>
  <div class="home">
    <!-- <div class="list-li-container" @click="showRedeemPopup()">
      <p class="node-name">qinjieqiong1</p>
      <p class="already-secured-title">已抵押</p>
      <div class="already-secured-content">
        <span class="num">6.3425</span>
        <span class="unit">COCOS</span>
      </div>
    </div> -->
    <div v-if="redeemList.length == 0" class="empty">
      <!-- {{$t('tipsMessage.business.noData')}} -->
      <div class="empty-icon">
          <img src="../assets/images/empty-list.png" alt="">
          <p>{{$t('tipsMessage.business.noData')}}</p>
      </div>
      
    </div>
    <div class="list-li-container" v-for="(li, index) in redeemList" @click="showRedeemPopup(index, li.beneficiary)" :key="index">
      <p class="node-name">{{beneficiaryAccountNameJson[li.beneficiary]}}</p>
      <p class="already-secured-title">{{$t('business.mortgaged')}}</p>
      <div class="already-secured-content">
        <span class="num">{{li.collateral_format}}</span>
        <span class="unit">COCOS</span>
      </div>
    </div>
    <!-- <div class="show-more" v-if="!searchAccountName && !stopLoading" @click="loadBottom()">
      {{$t('common.ShowMore')}}
    </div> -->


    <div class="mask" v-if="isRedeemPopup">
      <div class="redeem-popup">
        <p class="title">{{$t('business.redeem')}}</p>
        <div class="redeem-input-bar">
          <ul class="redeem-head">{{$t('business.redemptionAccount')}}：</ul>
          <ul class="redeem-content">{{currentAccount.beneficiary_account_name}}</ul>
        </div>
        <div class="redeem-input-bar">
          <ul class="redeem-head">{{$t('business.redeem')}}COCOS</ul>
          <input type="text" :placeholder="$t('tipsMessage.common.pleaseEnter')" class="redeem-input" v-model="mortgageCOCOSAmount">
        </div>

        <div class="btn-bar">
          <ul class="cancel" @click="hideRedeemPopup()">{{$t('common.cancel')}}</ul>
          <ul class="confirm" @click="updateCollateralForGasAjas()">{{$t('common.confirm')}}</ul>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import {
  getAccountInfo,
  queryDataByIds,
  updateCollateralForGas
} from "../../libs/bcx.api";
import { cacheSession, cacheKey } from "../../libs/Utils"
import { Indicator, Toast, MessageBox } from "mint-ui";
import { IntegerOrDecimalReg2 } from '../../libs/regular'
export default {
  data() {
    return {
      isRedeemPopup: false,
      redeemList: [],
      beneficiaryAccountNameJson: {},

      currentAccount: {},
      mortgageCOCOSAmount: '',
      mortgageCOCOSAmountRegular: '',

      myAccountName: '',
      collateralFormat: ''
    };
  },
  watch: {
    'mortgageCOCOSAmount': function (val) {
      let _this = this
      if (!val) {
        this.mortgageCOCOSAmountRegular = this.mortgageCOCOSAmount
        return false
      }
      
      if (IntegerOrDecimalReg2.test(val)) {
          if (Number(this.mortgageCOCOSAmount) > 999999999) {
            this.mortgageCOCOSAmount = this.mortgageCOCOSAmountRegular
          } else {
            this.mortgageCOCOSAmountRegular = this.mortgageCOCOSAmount
          }
        
      } else {
        this.mortgageCOCOSAmount = this.mortgageCOCOSAmountRegular
      }
    },
  },
  mounted() {
    this.mortgageAjax()
  },
  methods: {
    hideRedeemPopup(){
      this.isRedeemPopup = false
    },
    showRedeemPopup(index,beneficiary){
      this.isRedeemPopup = true
      console.log(beneficiary)
      this.currentAccount = {}
      
      this.redeemList[index].beneficiary_account_name = this.beneficiaryAccountNameJson[beneficiary]
      this.currentAccount = this.redeemList[index]
      console.log(this.currentAccount)
      this.collateralFormat = this.currentAccount.collateral_format
      
    },
    queryDataByIdsAjax(ids){
      let _this = this
      queryDataByIds(ids).then( res => {
        console.log('----------queryDataByIdsAjax----------')
        console.log(res)
        let accountNameObj = _this.beneficiaryAccountNameJson
        _this.beneficiaryAccountNameJson = {}
        accountNameObj[ids[0]] = res.data[0].name
        _this.beneficiaryAccountNameJson = accountNameObj
        console.log('================')
        console.log(_this.beneficiaryAccountNameJson)
      })
    },
    mortgageAjax(){
      // mortgager
      let _this = this
      _this.redeemList = []
      getAccountInfo().then( res => {
        console.log('=======getAccountInfo=======')
        console.log(res)
        _this.myAccountName = res.account_name
        let localhost = "http://192.168.15.60:8010/api/v1/mortgage"
        // let resUrl = "http://vote.test.cocosbcx.net/api/api/v1/mortgage";
        let resUrl = "https://vote.cocosbcx.net/api/api/v1/mortgage";
        let formData = {
          account_id: res.account_id,
          type: 'mortgager'
        }
        _this.$axios
        .post(resUrl, formData)
        .then(function(response) {
          console.log('-------------mortgageAjax----------')
          console.log(response)
          for (let i = 0; i < response.data.result.length; i++) {
            response.data.result[i].collateral_format = (Number(response.data.result[i].collateral)/Math.pow(10,5))
            _this.queryDataByIdsAjax([response.data.result[i].beneficiary])
          }
          // _this.redeemList = response.data.result.filter(li => {
          //   return li.beneficiary != res.account_id
          // })
          _this.redeemList = response.data.result
        })
      })
    },
    
    updateCollateralForGasAjas(){
      let _this = this
          getAccountInfo().then( getAccountInfoResult=>{
          console.log('-------getAccountInfoResult---------')
          console.log(getAccountInfoResult)
          if (_this.mortgageCOCOSAmount <= 0) {
            
            Toast({
              message: _this.$t('business.MortgageQuantityMustBeGreaterThanZero'),
              className: 'toast-style',
              duration: 2000
            });
            return false
          }
          let amount = 0
          if (_this.isMortgage) {
            amount = Number(_this.mortgageCOCOSAmount) + Number(_this.currentAccount.collateral_format)
          } else {
            amount = Number(_this.currentAccount.collateral_format) - Number(_this.mortgageCOCOSAmount)
          }
          if (Number(_this.collateralFormat) < Number(_this.mortgageCOCOSAmount)) {
            
              Toast({
                message: _this.$t('business.MortgageValueIsNotEnough'),
                className: 'toast-style',
                duration: 2000
              });
              return false
          }
          updateCollateralForGas({
            // 抵押人
            mortgager:  _this.myAccountName,
            // 受益人
            beneficiary: _this.currentAccount.beneficiary_account_name,
            // 抵押数量  COCOS
            amount: amount,
            // 是否是提议
            isPropose: false
          }).then(res=>{
            console.log('updateCollateralForGasAjas-----------------res')
            console.log(res)
            if (res.code == 1) {
              // Toast({
              //   message: _this.isMortgage?'领取成功':'赎回成功',
              //   className: 'toast-style',
              //   duration: 2000
              // });
              _this.receiverGASaccount = ''
              _this.hideRedeemPopup()
              
              Indicator.open({
                spinnerType: "fading-circle"
              });
              MessageBox.alert('',{
                title:'',
                message:_this.isMortgage?_this.$t('business.SuccessfulMortgage'):_this.$t('business.SuccessfulRedemption'),
                confirmButtonText: _this.$t('common.confirm')
              }).then(action => {
                
                setTimeout(function () {
                  Indicator.close();
                  _this.mortgageAjax()
                }, 1000)
                
              });
                        
                
            } else {
              
              Toast({
                message:  _this.isMortgage?_this.$t('business.FailedToMortgage'):_this.$t('business.FailedToRedeem'),
                className: 'toast-style',
                duration: 2000
              });
              _this.hideRedeemPopup()
            }
          })
        })
      
    }
  }
};
</script>



<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.empty{
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  font-size: 0.32rem;
  text-align: center;
  color: #aaaaaa;
  background: #fff;
}
.empty .empty-icon{
  width: 100%;
  position: absolute;
  top: 30%;
}
.empty .empty-icon img{
  display: block;
  margin: 0 auto 0;
  padding: 0;
}
.empty .empty-icon p{
  font-size: 0.26rem;
  text-align: center;
  margin-top: 0.3rem;
}
.home {
  width: 100%;
  height: 100%;
  background: #fff;
  padding-top: 0.01rem;
}
.list-li-container {
  width:3.45rem;
  background:rgba(246,248,251,1);
  border-radius: 0.08rem;
  padding-top: 0.15rem;
  padding-left: 0.15rem;
  padding-right: 0.15rem;
  padding-bottom: 0.2rem;
  margin: 0.15rem auto 0 ;
}
.node-name {
  width: 100%;
  height: 0.22rem;
  line-height: 0.22rem; 
  font-size: 0.16rem;
  font-weight:500;
  color:rgba(38,42,51,1);
}
.already-secured-title {
  width: 100%;
  height: 0.18rem;
  font-size: 0.12rem;
  font-weight:500;
  color:rgba(38,42,51,1);
  line-height: 0.18rem;
  margin-top: 0.2rem;
}
.already-secured-content{
  width: 100%;
  margin-top: 0.03rem;
  height: 0.24rem;
  line-height: 0.24rem;
}
.already-secured-content .num{
  height: 0.24rem;
  font-size: 0.2rem;
  font-weight:bold;
  color:rgba(38,42,51,1);
  line-height: 0.24rem;
}
.already-secured-content .unit{
  margin-left: 0.06rem;
  height: 0.18rem;
  font-size: 0.12rem;
  font-weight:400;
  color:rgba(38,42,51,1);
  line-height: 0.18rem;
}
.mask{
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background:rgba(38,42,51,0.4);
  z-index: 100;
}
.redeem-popup{
  width: 3.05rem;
  height: 2.2rem;
  background:rgba(255,255,255,1);
  border-radius: 0.12rem;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -1.1rem;
  margin-left:-1.52rem;
  padding-right: 0.2rem;
  padding-left: 0.2rem;
}
.redeem-popup .title{
  margin-top: 0.2rem;
  height: 0.24rem;
  line-height: 0.24rem;
  font-size: 0.16rem;
  font-weight:500;
  color:rgba(38,42,51,1);
  text-align: center;
}
.redeem-popup .redeem-input-bar {
  width: 100%;
  height: 0.44rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.redeem-popup .redeem-input-bar .redeem-head{
  height: 0.2rem;
  line-height: 0.2rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(38,42,51,1);
  padding-right: 0.1rem;
}
.redeem-popup .redeem-input-bar .redeem-content{
  height: 0.2rem;
  line-height: 0.2rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(38,42,51,1);
}
.redeem-popup .redeem-input-bar .redeem-input{
  width: 1.72rem;
  height: 0.44rem;
  line-height: 0.44rem;
  background:rgba(246,248,251,1);
  border-radius: 0.06rem;
  font-size: 0.12rem;
  font-weight:400;
  color:rgba(38,42,51,1);
  text-indent: 0.14rem;
}
.redeem-popup .btn-bar {
  width: 100%;
  height: 0.43rem;
  border-top: 1px solid rgba(232,235,241,1);
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.redeem-popup .btn-bar ul{
  height: 0.43rem;
  line-height: 0.43rem;
  width: 50%;
  text-align: center;
  font-size: 0.16rem;
  font-weight:400;
  color:rgba(72,104,220,1);
}
.redeem-popup .btn-bar ul.cancel {
  color:rgba(72,104,220,1);
}
.redeem-popup .btn-bar ul.confirm {
  color:rgba(245,97,81,1);
}
.show-more{
  height: 0.6rem;
  line-height: 0.6rem;
  font-size: 0.18rem;
  text-align: center;
  color: #333;
}
</style>





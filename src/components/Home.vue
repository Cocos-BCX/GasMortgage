<template>
  <div class="home">
    <div class="center-container">
      <div class="available-GAS">
        <p class="title">GAS</p>
        <div class="available-bar">{{$t('business.available')}}：{{myAvailableGAS || 0}} GAS / {{totalGAS || 0}} GAS</div>
        <p class="receive-title">{{$t('business.couldBeReceived')}}：</p>
        <div class="receive-content">
          <p class="num">{{receiveGAS || 0}}</p>
          <p class="unit">GAS</p>
        </div>
        <div class="receive-content">
          <p class="num">{{receiveCOCOS || 0}}</p>
          <p class="unit">COCOS</p>
        </div>
        <a href="javascript:void(0);" class="collect-immediately-btn" @click="claimVestingBalanceAjax()">{{$t('business.receiveImmediately')}}</a>
      </div>

      <div class="cocos-container">
        <div class="title">COCOS</div>
        <div class="redeem-info">
          <div>
            
            <p class="tit">{{$t('business.redeeming')}} <a href="javascript:void(0);" @click="tipsTime()" class="tips">?</a> </p>
            <ul class="receive-content">
              <li class="num">{{redeemAsset || 0}}</li>
              <li class="unit">COCOS</li>
            </ul>
          </div>
          <div>
            <p class="tit">{{$t('business.mortgaged')}}</p>
            <ul class="receive-content">
              <li class="num">{{mortgageAsset || 0}}</li>
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
            <span>{{$t('business.mortgage')}}</span>
          </li>
          <li @click="changeIsMortgage(false)">
            <img v-if="!isMortgage" src="../assets/images/circle.png" alt="">
            <img v-if="isMortgage" src="../assets/images/nochoice.png" alt="">
            <span>{{$t('business.redeem')}}</span>
          </li>
        </ul>
        
        <div class="balance">
          <p>{{$t('business.balance')}}：{{availablBalance || 0}} COCOS</p>
          <router-link class="rental-list" to="/rentallist">{{$t('business.rentalList')}}</router-link>
        </div>
        <div class="GAS-mortgage-title">
          <p v-if="isMortgage">{{$t('business.GASMortgage')}}</p>
          <p v-if="!isMortgage">{{$t('business.GasRedemption')}}</p>
          <!-- <ul class="blance">可赎回：100 COCOS</ul> -->
        </div>
        <div class="mortgage-num">
          <input type="text" :placeholder="$t('business.putInCOCOS')" v-model="mortgageCOCOSAmount">
          <p>≈ {{conversionGAS || 0}} GAS</p>
        </div>

        <div class="receiving-account-bar">
          <div class="title">
            <!-- <ul>接收账号</ul> -->
            <ul v-if="isMortgage">{{$t('business.receiveAccount')}}</ul>
            <ul v-if="!isMortgage">{{$t('business.RetrieveAccount')}}</ul>
            <ul class="tab">
              <li @click="changeIsSelf(true)">
                <img v-if="isSelf" src="../assets/images/circle.png" alt="">
                <img v-if="!isSelf" src="../assets/images/nochoice.png" alt="">
                <span>{{$t('business.Yourself')}}</span>
              </li>
              <li @click="changeIsSelf(false)">
                <img v-if="!isSelf" src="../assets/images/circle.png" alt="">
                <img v-if="isSelf" src="../assets/images/nochoice.png" alt="">
                <span>{{$t('business.Others')}}</span>
              </li>
            </ul>
          </div>
          <input @blur="scrollTop()" v-if="!isSelf" class="receiverGASaccount" type="text" v-model="receiverGASaccount" :placeholder="$t('tipsMessage.common.pleaseEnter')">
        </div>
        
      </div>

      <div class="next" :class="{isDisabled: isDisabled}" @click="updateCollateralForGasAjax()">{{updateCollateralForGasText}}</div>
    </div>
  </div>
</template>


<script>
import {
  queryAccountBalances,
  queryDataByIds,
  getAccountInfo,
  queryAccountInfo,
  queryVestingBalance,
  queryGas,
  updateCollateralForGas,
  claimVestingBalance,
} from "../../libs/bcx.api";
import { cacheSession, cacheKey } from "../../libs/Utils"
import { Indicator, Toast, MessageBox } from "mint-ui";
import { IntegerOrDecimalReg2 } from '../../libs/regular'
export default {
  data() {
    return {
      isDisabled: false,

      // myCOCOS: '',
      availablBalance: '',
      myAvailableGAS: '',
      receiveGAS: '',
      receiveCOCOS: '',
      totalGAS: '',

      redeemAsset: '',
      mortgageAsset: 0,
      mortgageAssetSelf: 0,

      isMortgage: true,

      receiverGASaccount: '',
      receiverGASaccountRegular: '',
      isSelf: true,
      mortgageCOCOSAmount: '',
      mortgageCOCOSAmountRegular: '',
      conversionGAS: '',

      asset_id: '',
      asset_id_cocos: '',
      mortgageList: [],
      beneficiaryAccountNameJson:{},

      updateCollateralForGasText: ''
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
            queryGas(val).then(res => {
              _this.conversionGAS = res.data.amount
            })
          }
        
      } else {
        this.mortgageCOCOSAmount = this.mortgageCOCOSAmountRegular
      }
    },
    // 'receiverGASaccount': function (val) {
    //   if (IntegerOrDecimalReg1.test(val)) {
    //     this.receiverGASaccountRegular = this.receiverGASaccount
    //   } else {
    //     this.receiverGASaccount = this.receiverGASaccountRegular
    //   }
    // }
  },
  mounted() {
    this.queryAccountBalancesAjax()
  },
  methods: {
    scrollTop(){
      window.scroll(0, 0);
    },
    tipsTime(){
      let _this = this

      Toast({
        message: _this.$t('business.hours24'),
        className: 'toast-style',
        duration: 3000
      });
    },
    updateCollateralForGasTextChange(){
      let _this = this
      if (this.isDisabled) {
        
        if (this.isMortgage) {
          // this.updateCollateralForGasText = '抵押中'
          this.updateCollateralForGasText = this.$t('business.mortgaging')
        } else {
          // this.updateCollateralForGasText = '赎回中'
          this.updateCollateralForGasText = this.$t('business.redeeming')
        }
      } else {
        if (this.isMortgage) {
          // this.updateCollateralForGasText = '抵押'
          this.updateCollateralForGasText = this.$t('business.mortgage')
        } else {
          // this.updateCollateralForGasText = '赎回'
          this.updateCollateralForGasText = this.$t('business.redeem')
        }
      }
      
    },
    changeIsSelf(val){
      this.isSelf = val
    },
    changeIsMortgage(val){
      this.isMortgage = val
      this.updateCollateralForGasTextChange()
    },
    queryAccountBalancesAjax(){
      
      this.updateCollateralForGasTextChange()
      let _this = this
      // _this.myCOCOS = ''
      _this.myAvailableGAS = ''
      queryAccountBalances().then( res => {
        if (res.code == 1) {
          // if (res.data.COCOS) {
          //   _this.myCOCOS = res.data.COCOS
          // }
          if (res.data.GAS) {
            _this.myAvailableGAS = res.data.GAS.toFixed(5)
          }
          
          _this.queryVestingBalanceAjax()
        }
      })
    },
    queryVestingBalanceAjax(){
      let _this = this
      _this.totalGAS = 0
      _this.receiveGAS = 0
      _this.asset_id = ''
      _this.asset_id_cocos = ''
      queryVestingBalance().then( res => {
        if (res.code == 1) {
          _this.totalGAS = Number(_this.myAvailableGAS)
          for (let i = 0; i < res.data.length; i++) {
            if (res.data[i].type == "cashback_gas") {
              _this.totalGAS = (Number(_this.totalGAS) + Number(res.data[i].return_cash)).toFixed(5)
              _this.receiveGAS = res.data[i].available_balance.amount
              _this.asset_id = res.data[i].id
              break;
            }
          }
          for (let i = 0; i < res.data.length; i++) {
            if (res.data[i].type == "cashback_vb") {
              _this.receiveCOCOS = res.data[i].available_balance.amount
              _this.asset_id_cocos = res.data[i].id
              break;
            }
          }
          
        _this.mortgageAjax()
          
        } else if(res.code == 402){
          return false
        } else {
          _this.codeErr(res)
        }
        // _this.queryGasAjax()
      })
    },
    queryAccountInfoAjax(){
      let _this = this
      queryAccountInfo().then( res => {
        
          // 总余额
        let balances = res.data.balances.filter((blance) => {
          return blance.asset_type == "1.3.0"
        })[0];
        // 冻结余额  availablBalance 可用余额
        let lockedAsset = 0
        if (res.data.account.asset_locked.locked_total.length == 0) {
          
          _this.availablBalance = Number((Number(balances.balance) - 0)/Math.pow(10,5))
        } else {
          let lockedAsset = res.data.account.asset_locked.locked_total.filter((lockedblance) => {
            if (lockedblance[0] == "1.3.0") return lockedblance 
          })[0];
          _this.availablBalance = parseInt((Number(balances.balance) - Number(lockedAsset[1]))/Math.pow(10,5))
        }
        _this.queryDataByIdsAjax()
        
      })
    },
    claimVestingBalanceAjax(){
      let _this = this
      if (this.receiveGAS <= 0) {
          Toast({
            message: _this.$t('business.NoGASCouldBeReceived'),
            className: 'toast-style',
            duration: 3000
          });
          return false
      }

      let assetIdArr = []
      if (_this.asset_id) {
        assetIdArr.push(_this.asset_id)
      }
      if (_this.asset_id_cocos) {
        assetIdArr.push(_this.asset_id_cocos)
      }
      console.log('assetIdArr')
      console.log(assetIdArr)
      claimVestingBalance(assetIdArr).then( res=>{
        console.log("====claimVestingBalance=======res=========")
        console.log(res)
        if (res.code == 1) {
                Toast({
                  message: _this.$t('business.SuccessfulReceiving'),
                  className: 'toast-style',
                  duration: 3000
                });
                setTimeout( function (params) {
                  _this.queryAccountBalancesAjax()
                }, 1000)
          // if (_this.asset_id_cocos) {
          //   claimVestingBalance(_this.asset_id_cocos).then( res=>{
          //     if (res.code == 1) {
          //       Toast({
          //         message: _this.$t('business.SuccessfulReceiving'),
          //         className: 'toast-style',
          //         duration: 3000
          //       });
          //       setTimeout( function (params) {
          //         _this.queryAccountBalancesAjax()
          //       }, 1000)
          //     } else {
          //       _this.codeErr(res)
          //       setTimeout( function (params) {
                  
          //         _this.queryAccountBalancesAjax()
          //       }, 1000)
          //     }
          //   })
          // } else {
          //   Toast({
          //     message: _this.$t('business.SuccessfulReceiving'),
          //     className: 'toast-style',
          //     duration: 3000
          //   });
          //   setTimeout( function (params) {
          //     _this.queryAccountBalancesAjax()
          //   }, 1000)
          // }
        } else {
          _this.codeErr(res)
          // console.log(res)
          // Toast({
          //   message: '领取失败',
          //   className: 'toast-style',
          //   duration: 3000
          // });
        }
        
      })
    },
    queryDataByIdsAjax(){
      let _this = this
        getAccountInfo().then( getAccountInfoResult => {
        return new Promise(function (resolve, reject) {
          queryDataByIds([getAccountInfoResult[cacheKey.accountId]]).then( res => {
              if (res.code == 1) {
                resolve(res.data[0].cashback_vb)
              }
            })
          })
        }).then(cashback_vb => {
          if (cashback_vb) {
            
            return new Promise(function (resolve, reject) {
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
    
    // 通过用户accountId获取用户名称
    queryDataByIdsAjaxSearch(ids){
      let _this = this
      queryDataByIds(ids).then( res => {
        let accountNameObj = _this.beneficiaryAccountNameJson
        _this.beneficiaryAccountNameJson = {}
        accountNameObj[ids[0]] = res.data[0].name
        _this.beneficiaryAccountNameJson = accountNameObj
      })
    },
    mortgageAjax(){
      // mortgager
      let _this = this
      getAccountInfo().then( res => {
      let localhost = "http://192.168.15.60:8010/api/v1/mortgage"
        let resUrl = "https://vote.cocosbcx.net/api/api/v1/mortgage";
        let formData = {
          account_id: res.account_id,
          type: 'mortgager'
        }
        console.log(res.account_id)
        _this.$axios
        .post(resUrl, formData)
        .then(function(response) {
          console.log('response')
          console.log(response)
          _this.mortgageList = response.data.result
          _this.mortgageAssetSelf = 0
          _this.mortgageAsset = 0

          // 验证接口数组是否存在
          if (response.data.result) {
            // 过滤抵押给自己的数量
            let myMortgager = response.data.result.filter((li) => {
              return li.beneficiary == res.account_id
            })[0]
            if (myMortgager) {
              
              _this.mortgageAssetSelf = (Number(myMortgager.collateral)/Math.pow(10,5))
            }

            // 自己抵押给所有人的数量  包括自己
            let myMortgagerlist = response.data.result
            for (let i = 0; i < myMortgagerlist.length; i++) {
              _this.mortgageAsset += Number(myMortgagerlist[i].collateral)/Math.pow(10,5)
              
            }
            if (_this.mortgageAsset.toString().indexOf('.') > -1) {
              if (_this.mortgageAsset.toString().split(".")[1].length > 5) {
                _this.mortgageAsset = _this.mortgageAsset.toFixed(5)
              } else {
                _this.mortgageAsset = _this.mortgageAsset
              }
            }
            
          
          for (let i = 0; i < response.data.result.length; i++) {
            response.data.result[i].collateral_format = (Number(response.data.result[i].collateral)/Math.pow(10,5))

            // 通过用户accountId获取用户名称
            _this.queryDataByIdsAjaxSearch([response.data.result[i].beneficiary])
          }
        // _this.queryDataByIdsAjax()
          }
          _this.queryAccountInfoAjax()  
        })
      }).catch(err => {
        console.log('-----------err-----------')
        console.log(err)
      })
    },
    updateCollateralForGasAjax(){
      if (this.isDisabled) return false
      let _this = this
      if (_this.mortgageCOCOSAmount <= 0) {
        
        Toast({
          message: _this.$t('business.MortgageQuantityMustBeGreaterThanZero'),
          className: 'toast-style',
          duration: 3000
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
            amount = Number(_this.mortgageCOCOSAmount) + Number(_this.mortgageAssetSelf)
            if (Number(_this.mortgageCOCOSAmount) > Number(_this.availablBalance)) {
              Toast({
                message: _this.$t('business.MortgageValueIsNotEnough'),
                className: 'toast-style',
                duration: 3000
              });
              return false
            }
          } else {
            amount = Number(_this.mortgageAssetSelf) - Number(_this.mortgageCOCOSAmount)
            if (amount < 0) {
              Toast({
                message: _this.$t('business.MortgageValueIsNotEnough'),
                className: 'toast-style',
                duration: 3000
              });
              return false
            }
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
            if (res.code == 1) {
              // Toast({
              //   message: _this.isMortgage?'抵押成功':'赎回成功',
              //   className: 'toast-style',
              //   duration: 3000
              // });
              
              _this.receiverGASaccount = ''
              _this.isDisabled = true
              
              _this.updateCollateralForGasTextChange()
              MessageBox.alert('',{
                title:'',
                message:_this.isMortgage?_this.$t('business.SuccessfulMortgage'):_this.$t('business.SuccessfulRedemption'),
                confirmButtonText: _this.$t('common.confirm')
              }).then(action => {
                setTimeout(function () {
                  _this.isDisabled = false
                  _this.queryAccountBalancesAjax()
                }, 2000)
              });
              
            } else {
              _this.codeErr(res)
              _this.receiverGASaccount = ''
              
              // Toast({
              //   message: '失败',
              //   className: 'toast-style',
              //   duration: 3000
              // });
              // _this.queryAccountBalancesAjax()
            }
          })
        })
      } else {
        if (!_this.receiverGASaccount) {
          Toast({
            message: _this.$t('business.MortgagorAccountCannotBeEmpty'),
            className: 'toast-style',
            duration: 3000
          });
          return false
        }
        new Promise(function (resolve, reject) {
          getAccountInfo().then( getAccountInfoResult => {
            resolve(getAccountInfoResult)
          })
        }).then( getAccountInfoResult=>{
          // mortgageCOCOSAmount
          let ifHave = false
          let amount = 0
          let targetAccountId = ''
          let ifHove = false
          for (const key in _this.beneficiaryAccountNameJson) {
            if (_this.beneficiaryAccountNameJson[key] == _this.receiverGASaccount) {
              ifHove = true
              targetAccountId = key
              break;
            }
          }
          if (_this.isMortgage) {
            if (ifHove) {
              let targetAccount = _this.mortgageList.filter( li => {
                return li.beneficiary == targetAccountId
              })
              amount = Number(targetAccount[0].collateral_format) + Number(_this.mortgageCOCOSAmount)
            } else {
              amount = _this.mortgageCOCOSAmount
            }
          } else {
            
            if (ifHove) {
              let targetAccount = _this.mortgageList.filter( li => {
                return li.beneficiary == targetAccountId
              })
              if (Number(_this.mortgageCOCOSAmount) > Number(targetAccount[0].collateral_format)) {
                
                Toast({
                  message: _this.$t('business.MortgageValueIsNotEnough'),
                  className: 'toast-style',
                  duration: 3000
                });
                return false
              } else {
                amount = Number(targetAccount[0].collateral_format) - Number(_this.mortgageCOCOSAmount)
              }
              
            } else {
              Toast({
                message: _this.$t('business.MortgageValueIsNotEnough'),
                className: 'toast-style',
                duration: 3000
              });
              return false
            }
          }
          
        
        // 空数组
          // for (let i = 0; i < _this.mortgageList.length; i++) {
          //   if (_this.receiverGASaccount == _this.beneficiaryAccountNameJson[_this.mortgageList[i].beneficiary]) {
          //     ifHave = true
          //     if (_this.isMortgage) {
          //       let amount = 0
                
          //       amount = Number(_this.mortgageList[i].collateral_format) + Number(_this.mortgageCOCOSAmount)
          //       console.log(amount)
          //     } else {
          //       amount = Number(_this.mortgageCOCOSAmount) - Number(_this.mortgageList[i].collateral_format)
          //     }
          //     break;
          //   }
          //       console.log(amount)
          // }
          // if (!ifHave) {
          //   if (_this.isMortgage) {
          //     amount = Number(_this.mortgageAssetSelf)
          //   } else {
              
          //     Toast({
          //       message: '抵押值不足',
          //       className: 'toast-style',
          //       duration: 3000
          //     });
          //     return false
          //   }
          // }
          updateCollateralForGas({
            // 抵押人
            mortgager: getAccountInfoResult[cacheKey.accountName],
            // 受益人
            beneficiary: _this.receiverGASaccount,
            // 抵押数量  COCOS
            amount: amount,
            // 是否是提议
            isPropose: false
          }).then(res=>{
            if (res.code == 1) {
              // Toast({
              //   message: _this.isMortgage?'抵押成功':'赎回成功',
              //   className: 'toast-style',
              //   duration: 3000
              // });
              // _this.receiverGASaccount = ''
              // _this.queryAccountBalancesAjax()
              
              _this.receiverGASaccount = ''
              _this.isDisabled = true
              _this.updateCollateralForGasTextChange()
              MessageBox.alert('',{
                title:'',
                message:_this.isMortgage?_this.$t('business.SuccessfulMortgage'):_this.$t('business.SuccessfulRedemption'),
                confirmButtonText: _this.$t('common.confirm')
              }).then(action => {
                setTimeout(function () {
                  _this.isDisabled = false
                  _this.queryAccountBalancesAjax()
                }, 2000)
              });
              
            } else {
              
            _this.codeErr(res)
              // Toast({
              //   message: '失败',
              //   className: 'toast-style',
              //   duration: 3000
              // });
              // _this.receiverGASaccount = ''
              // setTimeout( function () {
              //   _this.queryAccountBalancesAjax()
              // }, 2000)
            }
          })
        })
      }
      
    },
    codeErr(res){
      let _this = this;
      if (res.code == 112) {
          Toast({
            duration: 3000,
            message: _this.$t('tipsMessage.business.importAccountPrivateKey'),
            className: 'toast-style',
          })
        return false
      } else if (res.code == 105) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.common[6]'),
            className: 'toast-style',
          })
        return false
      } else if (res.code == 402) {
        return false
      } else {
        if (res.message.indexOf('Parameter is missing') > -1) {
          
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.common[101]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("world view name can't start whith a digit")>-1) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.creatWorldView[3]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("Please login first")>-1) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.common[114]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf('Insufficient Balance') > -1) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.common.InsufficientBalance'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf('You\'re not a nh asset creator')>-1) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.creatWorldView[2]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("world view name can't start whith a digit")>-1) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.creatWorldView[3]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("Most likely a uniqueness constraint is violated")>-1) {
          
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.creatWorldView[0]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("missing required owner authority")>-1) {
          
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.creatWorldView[0]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("locked->value >= 0")>-1) {
          
          Toast({
            duration: 3000,
            message: _this.$t('tipsMessage.business.lockedGreaterThanValue'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("Wrong password")>-1) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.common[6]'),
            className: 'toast-style',
          })
          
        } else if (res.message.indexOf("Account does not exist")>-1) {
          Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.common[8]'),
            className: 'toast-style',
          })
        } else if (res.message.indexOf("No reward available")>-1) {
          Toast({
            duration: 2000,
            message: _this.$t('interFaceMessage.common[7]'),
            className: 'toast-style',
          })
        } else {
            Toast({
            duration: 3000,
            message: _this.$t('interFaceMessage.common[4]'),
            className: 'toast-style',
          })
        }
      }
      
      return false
    }

  }
};
</script>



<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.available-GAS{
  width: 100%;
  /* height: 1.55rem; */
  background: #fff;
  border-radius: 0.08rem;
  padding-left: 0.15rem;
  padding-right: 0.15rem;
  padding-bottom: 0.1rem;
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
  font-size: 0.16rem;
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
  bottom: 0.15rem;
  padding-left: 0.15rem;
  padding-right: 0.15rem;
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
  display: block;
}
.GAS-mortgage-title{
  width: 100%;
  height: 0.2rem;
  line-height: 0.2rem;
  font-size: 0.14rem;
  font-weight: 400;
  color:rgba(38,42,51,1);
  margin-top: 0.15rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mortgage-num {
  width: 100%;
  margin-top: 0.05rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(230,230,230,1);
}
.mortgage-num input {
  width: 50%;
  height: 0.34rem;
  line-height: 0.34rem;
  font-size: 0.14rem;
  font-weight:400;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mortgage-num p{
  height: 0.34rem;
  font-size: 0.14rem;
  font-weight:400;
  color:rgba(165,169,177,1);
  line-height: 0.2rem;
  padding-bottom: 0.14rem;
}
.mortgage-num .blance{
  
  height: 0.18rem;
  font-size: 0.12rem;
  font-weight:400;
  color:rgba(38,42,51,1);
  line-height: 0.18rem;
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
  /* width: 1.2rem; */
  height: 0.2rem;
  line-height: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

}
.receiving-account-bar ul.tab img{
  width: 0.2rem;
  height: 0.2rem;
  margin-right: 0.03rem;
}
.receiving-account-bar ul.tab li {
  /* width: 0.53rem; */
  width: auto;
  height: 0.2rem;
  line-height: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: 0.05rem;
}
.receiving-account-bar ul.tab li span{
  
  height: 0.2rem;
  font-size: 0.14rem;
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
  color:rgba(38,42,51,1);
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

.isDisabled{
  background:rgba(38,42,51,0.4);
}
.tips{
  width: 0.12rem;
  height: 0.12rem;
  line-height: 0.12rem;
  color: rgba(165,169,177,1);
  font-size: 0.12rem;
  border: 1px solid rgba(165,169,177,1);
  display: inline-block;
  border-radius: 50%;
  text-align: center;
}
</style>





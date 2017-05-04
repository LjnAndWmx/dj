// pages/home/home.js
var util = require('../../utils/util.js');
var ports = require('../../utils/ports.js');
var address = require('../../utils/address.js');
//引入灯箱组件
var Slider = require('../../template/slider/slider.js');
// 优惠标签配色
var tagColor = util.getTagColor();
var dialog = [
    {
      title: '发现您的收货地址已变更',
      content: '是否保留原收货地址？',
      cancelText: '保留地址',
      confirmText: '切换地址',
      success: function(res){
          if (res.confirm) {
            // 切换至当前定位门店
            var _self = this,
                gpsInfo = JSON.parse(util.getStorage("gps_info"));
            if(gpsInfo){
                address.setCurrentAddress({
                    city: '',
                    city_name: '',
                    addressline: gpsInfo.location_addr,
                    address_lng: gpsInfo.lng,
                    address_lat: gpsInfo.lat,
                    hasLocationStore: 0                    
                });
                wx.redirectTo({
                    url: '../index/index' 
                });
            }
          }
      }
    }
];
//营销位配置
var cfg={1:5,2:7,3:8,4:4};
Page({
  data:{
      storeAnnouncement: '', //门店公告
      // 当前地址信息
      address:{},
      showAddress:'',
      // 首页信息
      idxData:[],
      // 显示门店详情
      showStoreDetail:false,
      // 营销位
      saleList:[],
      saleType:1,

      // 显示商品某项分类
      showProCate:false,

      // 是不中显示购物车列表面板
      showCartPanel:false,
      // 门店数据
      storeData:{},
      // 购物车数据
      cartData:[],
      // 购物车综合信息
      cartBaseInfo:[],

      
      //单前分类栏目所属类型index
      currentIndex: 0,
      //当前分类Id
      currentCateId: 0,
      //设置分类滚动条位置
      scrollLeft: 0,
      //产品数组
      pros:[],
      //分页信息
      pages:{},
      // 商品分类loading标识
      showLoadingFlag:[],
      //商品分类loaded标识
      showLoadedFlag: []
  },
  //点击分类
  cateClick: function(e){
      this.scrollLeftChange(e.currentTarget.dataset.index);
      this.setData({
            currentIndex: e.currentTarget.dataset.index,
            currentCateId: e.currentTarget.dataset.id
      });
  },     
  //滑动产品swiper
  productSwiperScroll: function(e){
      var _self = this;
      this.scrollLeftChange(e.detail.current);
      this.setData({
            currentIndex: e.detail.current,
            currentCateId: _self.data.idxData.cates[e.detail.current].cate_id
      });
  }, 
  //分类滚动条位置变化
  scrollLeftChange: function(index){
       var winWidth = wx.getSystemInfoSync().windowWidth;
       var rpx = 750/winWidth;
       var arr = new Array(this.data.idxData.cates.length).fill(false);
       this.setData({
            scrollLeft: index < 4 ? 0 : index * 168 / rpx,
            showLoadingFlag: arr.fill(true, index, index+1)
       });
  },
  //点击营销位
  saleTap: function(e){
      console.log(e);
  },
  toStoreDetail: function(){
      console.log('打开详情页');
  },
  handleShowByAddress: function(){
      var _self = this;
      // 显示地址
      this.setData({
          showAddress: _self.data.address.location_addr
      });
      // 通过地址信息获取门店信息(region_id,lat,lng)
      this.getStoreInfo().then(result=>{
          this.setStoreData(result.data);
          // this.validCartData();
      });      
  },
  // 获取门店首页信息
  getStoreInfo: function(){
      var _this = this,
          adr = this.data.address,
          selectStoreId = util.getStorage("select_store_id");
      return util.wxRequest({
            method: 'POST',
            url: ports.storeShow,
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
                store_id: selectStoreId || '',
                region_id: adr.region_id,
                lat: adr.lat,
                lng: adr.lng
            }
        }).then(function(result) {
            console.log(result)
            return Promise.resolve(result);
        })
        .catch(function(e){
            return Promise.reject(e);
        });
  },
  // 分页加载商品列表
  loadingProList: function(cateId,index) {
      console.log(cateId)
    return () => {
        if(typeof this.data.pages[index]=='undefined'){
            var param1 = {};
            var string1 = "pages["+index+"]";
            param1[string1] = {};
            this.setData(param1);
        }
        if(typeof this.data.pages[index].page=='undefined'){
            var param2 = {};
            var string2 = "pages["+index+"].page";
            param2[string2] = 0;            
            this.setData(param2);
        }
        if(typeof this.data.pages[index].totalPage=='undefined'){
            var param3 = {};
            var string3 = "pages["+index+"].totalPage";
            param3[string3] = 1;            
            this.setData(param3);
        }
        var param4 = {};
        var string4 = "pages["+index+"].page";
        var i4 = this.data.pages[index].page;
        param4[string4] = i4++; 
        this.setData(param4);

        if(this.data.pages[index].page > this.data.pages[index].totalPage) {
            var param5 = {};
            var string5 = "showLoadedFlag[" + index + "]";
            param5[string5] = true;
            this.setData(param5);
            return;
        }

        this.getProductList(cateId,index).then(result=>{
            var param6 = {};
            var string6 = "pages["+index+"].totalPage";
            param6[string6] = result.data.totalPage;            
            this.setData(param6);

            if(typeof this.data.pros[index]=='undefined'){
                var param7 = {};
                var string7 = "pros["+index+"]";
                param7[string7] = [];            
                this.setData(param7);
            }
            var oldpros = this.data.pros[index];
            var pros = oldpros.concat(result.data.goodsList);
            var param8 = {};
            var string8 = "pros["+index+"]";
            param8[string8] = pros;            
            this.setData(param8);

            var param9 = {};
            var string9 = "showLoadingFlag[" + index + "]";
            param9[string9] = false;
            this.setData(param9);             
        });
    }
  },  
  // 获取商品列表
  getProductList: function(cateId,index){
        if(typeof this.data.pages[index]=='undefined'){
            //TODO，实现this.pages[index]={}
            var param = {};
            var string = "pages["+index+"]";
            param[string] = {};
            this.setData(param);
        }
        if(typeof this.data.pages[index].page=='undefined'){
            //this.pages[index].page=0;
            var param = {};
            var string = "pages["+index+"].page";
            param[string] = 0;            
            this.setData(param);
        }
        var _self = this;
        return util.wxRequest({
            method: 'POST',
            url: ports.goodsGoodslist,
            header: {
            'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
                store_id: _self.data.storeData.id,
                cat_id: cateId,
                page: _self.data.pages[index].page
            }
        }).then(function(result) {
            return Promise.resolve(result);
        }).catch((e)=>{
            return Promise.reject(e);
        });
  },
  //门店公告控制
  changeShowStoreDetail: function(){
        var _self = this;
        this.setData({
            showStoreDetail: !_self.data.showStoreDetail
        });
  },
  // 处理优惠标签
  handleAct: function(str,index){
        if(!str){
            return '';
        }
        var arrStr=str.split(/[:：]/),
            tag=arrStr[0].replace(/[\[\]]/g,''),
            tagStr=arrStr[1];
        return {
            backgroundColor: tagColor[index % tagColor.length],
            tag: tag,
            tagStr: tagStr
        };
  },
  //切分公告字符串
  splitStoreAnnouncement: function(str){
      if(str == ''){ return ''; }
      return str.split(/\n|\r\n/g);
  },
  // 设置首页数据
  setStoreData: function(idxData){
      this.slider.initData(idxData.store_info.store_picture_list); //初始化swiper图片
      var _self = this,
          cateFlagArr = new Array(idxData.cates.length).fill(false); //初始化分类标识位数组
      //优惠标签处理
      idxData.store_info.store_activity_format = this.handleAct(idxData.store_info.store_activity_format);
      var store_activity_list = idxData.store_info.store_activity_list;
      for(let i = 0; i < store_activity_list.length; i++){
            store_activity_list[i] = this.handleAct(store_activity_list[i], i);
      }
      this.setData({
        idxData: idxData, // 首页通用数据
        storeData: idxData.store_info, // 门店信息
        saleList: idxData.module.data.slice(0,cfg[idxData.module.show_type]), // 营销位
        saleType: idxData.module.show_type,
        showProCate: idxData.cates ? true : false,
        currentCateId: idxData.cates[0].cate_id,
        showLoadingFlag: cateFlagArr,
        showLoadedFlag: cateFlagArr
      });
      this.setData({
         storeAnnouncement: _self.splitStoreAnnouncement(_self.data.idxData.announcement || _self.data.storeData.announcement)
      });
      // 优先使用用户选中的address_id
      var addressId = this.data.address.address_id,
          currentAddress = util.getStorage("currentAddress");
      if(currentAddress){
          currentAddress = JSON.parse(currentAddress);
          addressId = currentAddress.address_id;
      }

      // 门店id
      var storeId = this.data.storeData.id;

      // 将当前选中的门店信息存入本地
      util.setStorage("current_store_info",JSON.stringify({
          address_id: addressId,
          store_id: storeId
      }));

      // 传递给vuex-cart
      // store.dispatch('updateCartData', {
      //     cartData: {
      //         storeId:storeId,
      //         storeName:_this.storeData.store_name,
      //         floorPrice:_this.storeData.floor_price,
      //         freeShipPrice:_this.storeData.free_ship_price,
      //         deliveryFee:_this.storeData.delivery_fee
      //     }
      // });
  },
  onLoad:function(options){
      //初始化灯箱组件
      this.slider = new Slider(this);
      /**
       * 1.拿到处理过的地址信息 final_address
       * 2.通过地址信息获取门店信息(region_id,lat,lng)
       * 3.将门店信息数据设置(填充)
       * 3.通过门店信息中商品分类，将分类第一项传递给ProductList.vue
       */
      var finalAddress = util.getStorage("final_address");
      if(finalAddress){
          //拿到处理过的地址信息 finalAddress
          this.setData({
              address: JSON.parse(finalAddress)
          });
          this.handleShowByAddress();
      }
      /**
       * 1.获取到页面分发信息，如果page为1且popType大于0说明要弹层处理
       * 2.弹层
       */
      var pageSwitchInfo = util.getStorage("page_switch_info");
      if(pageSwitchInfo){
          // 拿到分发页面信息
          pageSwitchInfo = JSON.parse(pageSwitchInfo);
          // 清空分发配置
          util.removeStorage("page_switch_info");
          // 弹层
          if((pageSwitchInfo.page == 1) && ( pageSwitchInfo.popType == 1)){
              dialog[switchInfo.popType-1].cancelColor = "#666666";
              dialog[switchInfo.popType-1].confirmColor = "#666666";
              wx.showModal(dialog[switchInfo.popType-1]);
          }
      }
      //ceshi
      this.loadingProList(0,0);
  },
  onReady:function(){
    // 页面渲染完成
    console.log(this.data)
  },
  onShow:function(){
    // 页面显示
  },
  onHide:function(){
    // 页面隐藏
  },
  onUnload:function(){
    // 页面关闭
  }
})
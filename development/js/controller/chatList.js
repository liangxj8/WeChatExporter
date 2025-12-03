/**
 * Created by shidanlifuhetian on 2018/8/15.
 */
// chatList.html页面的controller
WechatBackupControllers.controller('ChatListController',["$scope","$state", "$stateParams",function ($scope,$state, $stateParams) {
    $scope.wechatUserList = [];
    $scope.meInfo={};
    $scope.roomInfo={};
    $scope.otherInfo={};
    $scope.everLoggedThisPhoneWchatUsersInfo ={};//index by md5
    $scope.dbTables = [];
    $scope.isChatRoom = [];
    $scope.myFriends = {};// index by md5 (of userName)
    $scope.totalTablesCount = -1;
    $scope.tableSelected = "";
    $scope.previewData = [];
    $scope.filePath = "";
    $scope.documentsPath = $stateParams.documentsPath;
    $scope.messageLimit = 10;

    // 解析 LoginInfo2.dat 获取所有用户的微信号和昵称
    // 返回：{MD5: {wechatID, nickname}} 的映射
    $scope.parseLoginInfo = function(documentsPath) {
        var fs = require('fs');
        var path = require('path');
        var md5 = require('js-md5');
        var loginInfoPath = path.join(documentsPath, 'LoginInfo2.dat');
        
        if (!fs.existsSync(loginInfoPath)) {
            console.log("LoginInfo2.dat 不存在");
            return {};
        }
        
        try {
            // 读取二进制文件，但尝试以字符串方式提取信息
            var buffer = fs.readFileSync(loginInfoPath);
            var content = buffer.toString('binary');
            var userInfoByMD5 = {};  // 改为按 MD5 索引
            
            // 查找所有 wxid_ 模式的微信号
            var wxidPattern = /(wxid_[a-z0-9]{10,20})/g;
            var matches = content.match(wxidPattern);
            
            if (matches) {
                // 去重
                var uniqueWxids = [];
                var seen = {};
                for (var i = 0; i < matches.length; i++) {
                    if (!seen[matches[i]]) {
                        uniqueWxids.push(matches[i]);
                        seen[matches[i]] = true;
                    }
                }
                
                console.log("LoginInfo2.dat 中找到", uniqueWxids.length, "个微信号:", uniqueWxids);
                
                // 对每个微信号，计算 MD5 并提取昵称
                for (var j = 0; j < uniqueWxids.length; j++) {
                    var wxid = uniqueWxids[j];
                    var wxidMD5 = md5(wxid);  // 计算微信号的 MD5
                    var wxidIndex = content.indexOf(wxid);
                    
                    if (wxidIndex > -1) {
                        // 提取 wxid 后面约 100 字节的内容
                        var afterWxid = content.substring(wxidIndex + wxid.length, wxidIndex + wxid.length + 100);
                        
                        // 查找可能的昵称（可打印字符，2-30 个字符）
                        var possibleNames = [];
                        var currentName = '';
                        
                        for (var k = 0; k < afterWxid.length; k++) {
                            var charCode = afterWxid.charCodeAt(k);
                            // 可打印 ASCII 字符或中文字符
                            if ((charCode >= 0x20 && charCode <= 0x7E) || charCode >= 0x4E00) {
                                currentName += afterWxid[k];
                            } else {
                                if (currentName.length >= 2 && currentName.length <= 30) {
                                    possibleNames.push(currentName);
                                }
                                currentName = '';
                            }
                        }
                        
                        // 选择最可能的昵称（排除特殊模式）
                        var nickname = "";
                        for (var m = 0; m < possibleNames.length; m++) {
                            var name = possibleNames[m].trim();
                            // 过滤掉看起来像配置项、手机号、或纯符号的字符串
                            if (name && 
                                !/^[A-Z_]+$/.test(name) && 
                                !/^\+?\d+$/.test(name) &&
                                !/^[^a-zA-Z0-9\u4e00-\u9fa5]+$/.test(name)) {
                                nickname = name;
                                break;
                            }
                        }
                        
                        // 按 MD5 索引存储用户信息
                        userInfoByMD5[wxidMD5] = {
                            wechatID: wxid,
                            nickname: nickname || wxid
                        };
                        
                        console.log("映射:", wxid, "→ MD5:", wxidMD5.substring(0, 8), "→ 昵称:", nickname || wxid);
                    }
                }
            }
            
            console.log("解析完成，建立", Object.keys(userInfoByMD5).length, "个 MD5 映射");
            return userInfoByMD5;
        } catch (error) {
            console.error("解析 LoginInfo2.dat 失败:", error);
            return {};
        }
    };

    // "构造函数"，页面载入的时候执行
    $scope.ChatListController = function () {
        console.log("constructor");
        console.log($stateParams);
        
        var fs = require('fs');
        var path = require('path');
        
        // 1. 解析 LoginInfo2.dat，得到 MD5 → 用户信息的映射
        var userInfoByMD5 = $scope.parseLoginInfo($scope.documentsPath);
        
        // 2. 扫描用户目录
        var documentsFileList = fs.readdirSync($scope.documentsPath);
        
        for(var i = 0; i < documentsFileList.length; i++) {
            var dirName = documentsFileList[i];
            
            // 检查是否是 32 位 MD5 格式的用户目录
            if(dirName.length === 32 && dirName !== "00000000000000000000000000000000") {
                console.log("找到用户目录:", dirName);
                $scope.wechatUserList.push(dirName);
                
                var lastHeadImagePath = path.join($scope.documentsPath, dirName, 'lastHeadImage');
                
                // 3. 从 MD5 映射中获取用户信息（dirName 就是微信号的 MD5）
                var userInfo;
                if (userInfoByMD5[dirName]) {
                    // 精确匹配成功！
                    userInfo = {
                        nickname: userInfoByMD5[dirName].nickname,
                        wechatID: userInfoByMD5[dirName].wechatID,
                        headUrl: ""
                    };
                    console.log("✓ 精确匹配:", dirName.substring(0, 8), "→", userInfo.wechatID, "→", userInfo.nickname);
                } else {
                    // 没有匹配到，使用 MD5 前缀作为默认值
                    var userPrefix = dirName.substring(0, 8);
                    userInfo = {
                        nickname: "用户-" + userPrefix,
                        wechatID: dirName,
                        headUrl: ""
                    };
                    console.log("✗ 使用默认:", userInfo.nickname);
                }
                
                // 4. 使用 lastHeadImage 作为头像（如果存在）
                if (fs.existsSync(lastHeadImagePath)) {
                    userInfo.headUrl = 'file://' + lastHeadImagePath;
                    console.log("  ✓ 头像: lastHeadImage");
                }
                
                $scope.everLoggedThisPhoneWchatUsersInfo[dirName] = userInfo;
            }
        }
        
        console.log("=====================================");
        console.log("扫描完成，找到", $scope.wechatUserList.length, "个用户");
        console.log("用户信息:", $scope.everLoggedThisPhoneWchatUsersInfo);
        console.log("=====================================");
    };
    // 执行"构造函数"
    $scope.ChatListController();

    $scope.onWechatUserMD5Selected = function(wechatUserMD5){
        console.log("====================================");
        console.log("🎯 用户被选中:", wechatUserMD5);
        console.log("📋 用户信息:", $scope.everLoggedThisPhoneWchatUsersInfo[wechatUserMD5]);
        console.log("====================================");
        
        var sqlite3 = require('sqlite3');
        var fs = require('fs');
        var path = require('path');

        console.log(wechatUserMD5);
        $scope.meInfo = $scope.everLoggedThisPhoneWchatUsersInfo[wechatUserMD5]
        $scope.meInfo['md5'] = wechatUserMD5
        $scope.dbTables =[];
        // var wechatUserNickname =
        // 1.   定位到当前目录的mmsqlite文件
        var sqlitefilePath = $scope.documentsPath + "/" + wechatUserMD5 + "/DB/MM.sqlite";
        var contactSqliteFilePath = $scope.documentsPath + "/" + wechatUserMD5 +"/DB/WCDB_Contact.sqlite";

        var contactDb = new sqlite3.Database(contactSqliteFilePath,sqlite3.OPEN_READONLY,function (error) {
            if (error){
                console.log("Database error:",error);
            }
        });

        contactDb.each("select *,lower(quote(dbContactRemark)) as cr from Friend;",function (error,row) {
            // 回调函数，每获取一个条目，执行一次，第二个参数为当前条目
            var md5 = require('js-md5');

            var nameMd5 = md5(row.userName);
            $scope.myFriends[nameMd5] = {
                wechatID:row.userName,
                rawNameInfo:row.cr//如果是chatroom，那么nameInfo.nickname就是房间名，如果不是chatroom，nameInfo.nickname就是对方昵称
            };

        },function (error, result) {
            console.log('names over:',result);
            console.log('names size:',$scope.myFriends.length);
        });

        $scope.filePath = sqlitefilePath;
        // sqlite3相关文档：https://github.com/mapbox/node-sqlite3/wiki/API

        // 新版微信将聊天记录分散在多个数据库中
        var dbPath = path.join($scope.documentsPath, wechatUserMD5, "DB");
        var dbFiles = ['MM.sqlite', 'message_1.sqlite', 'message_2.sqlite', 'message_3.sqlite', 'message_4.sqlite'];
        var existingDbFiles = [];
        
        // 检查哪些数据库文件存在
        dbFiles.forEach(function(dbFile) {
            var fullPath = path.join(dbPath, dbFile);
            if (fs.existsSync(fullPath)) {
                existingDbFiles.push(fullPath);
                console.log("找到数据库:", dbFile);
            }
        });
        
        console.log("将查询 " + existingDbFiles.length + " 个数据库文件");
        
        var processedDbs = 0;
        var totalTablesFound = 0;
        
        // 遍历每个数据库文件，查找聊天表
        existingDbFiles.forEach(function(dbFilePath) {
            var db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, function (error) {
                if (error){
                    console.log("Database error for", dbFilePath, ":", error);
                    processedDbs++;
                    return;
                }
            });
            
            console.log("正在查询数据库:", dbFilePath);
            
            // 查找数据库内的所有table，并逐个遍历
            db.each("select * from SQLITE_MASTER where type = 'table' and name like 'Chat/_%' ESCAPE '/' ;",function (error,row) {
            // 回调函数，每获取一个条目，执行一次，第二个参数为当前条目
            // 声明一个promise，将条目的name传入resolve
            var getRowName = new Promise(function (resolve,reject) {
                if(!error)
                {
                    resolve(row.name);
                }else{
                    reject(error);
                }
            });
            // 声明一个带参数的promise，写法和getRowName略有不同
            var getCount = function (rowName) {
                var promise = new Promise(function (resolve,reject) {
                    var sql = "select count(*) as count from "+ rowName;
                    var r = db.get(sql,function (error,result) {
                        if(!error) {
                            //console.log("count:", result.count);
                            //将传入的rowName和结果的count数一并传出去
                            resolve([rowName,result.count]);
                        }
                        else {
                            console.log("count error:", error);
                            reject(error)
                        }
                    });
                });
                return promise;
            };
            // 执行promise。
            // 先getRowName,然后每获取到一个rowName就传入到getCount函数内，接着一个.then().里面输出的就是rowName和count一一对应的数组
            getRowName
                .then(getCount)
                .then(function (result) {
                    db.get("select count(*) as count,MesSvrID as serverID from "+result[0],function (error, row) {
                        //console.log(row);
                        if(!(row.count <= $scope.messageLimit))
                        {
                            // result[0] : table name // result[1] : table count
                            var currentChatterMd5 = getChatterMd5(result[0]);
                            //result.push(currentChatterMd5);
                            //console.log("nickNames Size here:",$scope.myFriends);
                            console.log("rowName:",result[0],
                                "count:",result[1],
                                " md5:",currentChatterMd5,
                                " nameInfo:",decode_user_name_info($scope.myFriends[currentChatterMd5].rawNameInfo),
                                " wechatID: ",$scope.myFriends[currentChatterMd5].wechatID);
                            result.push(decode_user_name_info($scope.myFriends[currentChatterMd5].rawNameInfo));

                            $scope.dbTables.push(result);
                            if ($scope.myFriends[currentChatterMd5].wechatID.indexOf('@chatroom') == -1){
                                $scope.isChatRoom[currentChatterMd5]=false
                            }else{
                                $scope.isChatRoom[currentChatterMd5]=true
                            }
                        }
                        $scope.$apply();
                    });
                });
            },function (error,result) {
                if(!error){
                    totalTablesFound += result;
                    console.log(dbFilePath, "- 完成，找到", result, "个聊天表");
                }else{
                    console.log(dbFilePath, "- 查询错误:", error);
                }
                
                processedDbs++;
                
                // 所有数据库都处理完毕
                if (processedDbs === existingDbFiles.length) {
                    $scope.totalTablesCount = totalTablesFound;
                    console.log("所有数据库查询完成，总计找到", totalTablesFound, "个聊天表");
                    console.log("可显示聊天列表数:", $scope.dbTables.length);
                }
                
                db.close();
            });
        });
    };
    // 用户在左侧选择了具体table
    $scope.onChatTableSelected = function (tableIndex) {
        console.log('isChatroom: ',$scope.isChatRoom);
        console.log($scope.dbTables[tableIndex])
        $scope.tableSelected = {
            md5:getChatterMd5($scope.dbTables[tableIndex][0]),
            tableName:$scope.dbTables[tableIndex][0],
            roomName:$scope.dbTables[tableIndex][2].nickname,
            isChatRoom:$scope.isChatRoom[$scope.dbTables[tableIndex][0].split('_')[1]]
        };
        $scope.previewData = [];
        // sqlite3相关文档：https://github.com/mapbox/node-sqlite3/wiki/API
        var sqlite3 = require('sqlite3');
        // 打开一个sqlite数据库
        var db = new sqlite3.Database($scope.filePath,sqlite3.OPEN_READONLY,function (error) {
            if (error){
                console.log("Database error:",error);
            }
        });

        var sql = "SELECT * FROM "+$scope.tableSelected['tableName']+" order by CreateTime desc limit 10";
        db.all(sql, function(err, rows) {
            for(var i in rows){
                var time = formatTimeStamp(rows[i].CreateTime)
                //console.log(time);
                $scope.previewData.push({
                    time:time,
                    message:rows[i].Message
                })
            }
            //console.log("scope apply,previewData count:",$scope.previewData.length)
            $scope.$apply();
        });
        $scope.addOtherChattersInfo();

    };
    $scope.addOtherChattersInfo = function () {
        console.log("Enter addOtherChattersInfo")
        var sqlite3 = require('sqlite3');
        var fs = require('fs')
        $scope.currentFriend = $scope.myFriends[getChatterMd5($scope.tableSelected['md5'])];
        $scope.isChatRoom = false;
        if ($scope.tableSelected.isChatRoom){
            console.log("群组聊天")
            $scope.currentFriend.wechatID = ""
            //群组聊天
        }else{
            console.log("一对一聊天")
            //一对一聊天
            var meMD5 = $scope.meInfo['md5']
            var contactSqliteFilePath = $scope.documentsPath + "/" + meMD5 +"/DB/WCDB_Contact.sqlite";
            var contactDb = new sqlite3.Database(contactSqliteFilePath,sqlite3.OPEN_READONLY,function (error) {
                if (error){
                    console.log("Database error:",error);
                }
            });
            var sql = "select dbContactHeadImage,lower(quote(dbContactRemark)) as cr from Friend where userName is '"+$scope.currentFriend.wechatID+"';";
           contactDb.get(sql,function (err, row) {
               console.log('other detail:',row)
               console.log(row.dbContactHeadImage.toString('utf8'))
               console.log(row.cr)
               var tmp = row.dbContactHeadImage.toString('utf8')
               var i = tmp.indexOf("/132")
               var b = tmp.slice(0,i+4)
               var i2 = b.indexOf('http:')
               var c = b.slice(i2)
               var user_name = decode_user_name_info(row.cr)
               console.log(user_name)

               $scope.otherInfo[$scope.currentFriend.wechatID]={
                   wechatID:$scope.currentFriend.wechatID,
                   headUrl:c,
                   nameInfo:user_name//getNickName(row.dbContactRemark)
               }
           })
        }
    };
    $scope.goToSoft2 = function () {
        $state.go('soft2',{
            documentsPath:$scope.documentsPath,
            meInfo:JSON.stringify($scope.meInfo),
            otherInfo:JSON.stringify($scope.otherInfo),
            roomInfo:JSON.stringify($scope.tableSelected),
            otherWechatID:$scope.currentFriend.wechatID
        });
    }
}]);
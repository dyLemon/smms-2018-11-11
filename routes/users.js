var express = require('express');
var router = express.Router();
//1.引入mysql
let mysql = require('mysql');
//引入crypto系统模块，为了密码加密
let md5 = require('crypto');
//2.链接数据库
let connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "smms"
})
//3 打开数据库
connection.connect();

// 管理员登录
router.post('/signin', function (req, res) {
  let { username, checkPass } = req.body;
  checkPass = md5.createHash('md5').update(checkPass).digest('hex');
  //获取数据库的数据
  let sqlSelect = `select u_id from userTable where userName = '${username}' and userPwd = '${checkPass}' `;
  connection.query(sqlSelect, (error, results) => {
    if (error) {
      throw err;
    } else {

      if (results[0].u_id > 0) {
        res.cookie('cookID', results);
        // console.log(req.cookies)
        res.send({ "ok": true, "msg": "登录成功" });

      } else {
        res.send({ "ok": false, "msg": "登录失败" });
      }

    }
  })
});
// 登录的管理员显示的名字
router.get('/nameAdmin', function (req, res) {
  let { cookID } = req.cookies;//接收cookID
  cookID = cookID[0].u_id;
  //查找用户名
  let sqlSele = 'select userName from usertable where u_id=?';
  connection.query(sqlSele, [cookID], (err, result) => {
    if (err) {
      throw err;
    } else {
      result = result[0].userName;
      res.send(result);
    }
  })
})

/* 管理员添加 */
router.post('/add', function (req, res) {
  //3.获取到前端表单的数据
  let { pass, username, region } = req.body;

  //判断添加的用户在数据库是否存在
  //查询数据库用户名数据
  let sqlsele = 'select userName from usertable';
  connection.query(sqlsele, (err, results) => {
    if (err) {
      throw err;
    } else {
      //遍历出数据库中的所有用户名字
      for (let i = 0; i < results.length; i++) {
        results[i] = results[i].userName;
        //判断输入的和数据库的是否一样,是一样就返回数据,终止循环
        if (username == results[i]) {
          res.send({ "ok": false, "msg": "用户名已经存在" });
          return false;
        }
      }
      //不存在就添加数据
      //加密密码
      pass = md5.createHash('md5').update(pass).digest('hex');
      //4.添加到数据库中
      //执行sql语句
      //let sqlinsert = `insert into userTable(userName,userPwd,userGroup) values('${username}','${pass}','${region}')`;
      //使用sql模块--防止sql语句的注入（不安全)
      let sqlinsert = 'insert into usertable(userName,userPwd,userGroup) values(?,?,?)';//用?号占位
      //定义一个参数数组--对应添加数据库的数据
      let sqlparams = [username, pass, region];
      connection.query(sqlinsert, sqlparams, (error, results) => {
        if (error) {
          throw error;
        } else {
          if (results.affectedRows > 0) {//affectedRows就是添加成功的一条数据
            res.send({ "ok": true, "msg": "添加成功" })
            // res.send("添加成功")
          } else {
            // res.send("添加失败")
            res.send({ "ok": false, "msg": "添加失败" })
          }
        }
      })

    }
  })

});

// 管理员列表
router.get('/list', (req, res) => {
  let sqlinsert = 'select * from usertable order by u_id desc';
  connection.query(sqlinsert, (error, results) => {
    if (error) {
      throw error;
    } else {
      // console.log(results);
      res.send(results);
    }
  })
})

//管理员删除
router.get('/delete', (req, res) => {
  //接收删除的id
  let delId = req.query.delId
  //删除数据
  let sqlDel = 'delete from usertable where u_id =?';
  connection.query(sqlDel, [delId], (error, result) => {
    if (error) {
      throw error;
    } else {
      if (result) {
        res.send({ "ok": true, "msg": "删除成功" });
      } else {
        res.send({ "ok": false, "msg": "删除失败" });
      }
    }
  })

})

//管理员信息修改回填表单
router.post('/updateList', (req, res) => {
  //接收到id
  let upId = req.body.index;
  //定义sql语句
  let sqlSele = 'select * from usertable where u_id=?';
  //执行
  connection.query(sqlSele, [upId], (err, results) => {
    if (err) {
      throw err;
    } else {
      res.send(results);
    }
  })
})

//管理员信息修改
router.post('/update', (req, res) => {
  //接收数据
  let { u_id, pass, username, region, oldPwd } = req.body;

  //判断密码
  if (oldPwd !== pass) {
    pass = md5.createHash('md5').update(pass).digest('hex');
  }
  let sqlUpdate = "update userTable set userName=?,userPwd=?,userGroup=? where u_id=?"; //占位符
  connection.query(sqlUpdate, [username, pass, region, u_id], (err, results) => {
    if (err) {
      throw err;
    } else {
      if (results.affectedRows > 0) {
        res.send({ "ok": true, "msg": "账号修改成功!" });
      }
      else {
        res.send({ "ok": false, "msg": "账号修改失败!" });
      }

    }
  })
})

//密码修改
router.post('/pwdEdit', (req, res) => {
  //接收前端数据
  let { oldPwd, pass } = req.body;
  //获取id
  let { cookID } = req.cookies;
  cookID = cookID[0].u_id;//获取到登录的id
  // console.log(typeof cookID);
  // 查询密码
  let sqlSelect = `select userPwd from usertable where u_id=${cookID}`;
  connection.query(sqlSelect, (error, results) => {
    if (error) {
      throw error;
    } else {
      results = results[0].userPwd;
      //判断
      if (oldPwd !== results) {
        res.send({ "ok": false, msg: '原密码错误' })
      } else {
        //修改数据库的密码
        let sqlUpdate = `update usertable set userPwd ='${pass}' where u_id=${cookID}`;
        connection.query(sqlUpdate, (error, results) => {
          if (error) {
            throw error;
          } else {
            res.send({ "ok": true, msg: '修改成功' })
          }
        })
      }
      console.log(results);
      // res.send(results);
    }
  })

})




module.exports = router;


"use strict"
var log = function() {
    console.log.apply(console, arguments)
}
var request = require('request')
var cheerio = require('cheerio')
var fs = require('fs')



// 定义一个类来保存电影的信息
// 这里只定义了 5 个要保存的数据
// 分别是  电影名 评分 引言 排名 封面图片地址
var Movie = function() {
    this.name = ''
    this.score = 0
    this.quote = ''
    this.ranking = 0
    this.coverUrl = ''
}


// 获取每个电影信息
var movieFromDiv = function(div) {
    // 这个函数来从一个电影 div 里面读取电影信息
    var movie = new Movie()
    // 使用 cheerio.load 函数来返回一个可以查询的特殊对象
    var e = cheerio.load(div)

    // 然后就可以使用 querySelector 语法来获取信息了
    // .text() 获取文本信息
    movie.name = e('.title').text()
    movie.score = e('.rating_num').text()
    movie.quote = e('.inq').text()

    var pic = e('.pic')
    movie.ranking = pic.find('em').text()
    // 元素的属性用 .attr('属性名') 确定
    movie.coverUrl = pic.find('img').attr('src')

    return movie
}


//输出抓取所有信息到指定路径
var saveMovies = function(movies) {
    // 这个函数用来把一个保存了所有电影对象的数组保存到文件中
    var fs = require('fs')
    var path = 'douban.txt'
    // 第二个参数是 null 不用管
    // 第三个参数是 缩进层次
    var s = JSON.stringify(movies, null, 2)
    fs.writeFile(path, s, function(error) {
        if (error !== null) {
            log('*** 写入文件错误', error)
        } else {
            log('--- 保存成功')
        }
    })
}


//抓取图片
var downloadCovers = function(movies) {
    for (var i = 0; i < movies.length; i++) {
        var m = movies[i]
        var url = m.coverUrl
        var path = m.name.split('/')[0] + '.jpg'
        request(url).pipe(fs.createWriteStream(path))
    }
}


//抓取每个页面信息
var moviesFromUrl = function(url) {
    // request 从一个 url 下载数据并调用回调函数
    console.log(url);
  request(url, function(error, response, body) {
        // 回调函数的三个参数分别是  错误, 响应, 响应数据
        // 检查请求是否成功, statusCode 200 是成功的代码
        if (error === null && response.statusCode == 200) {
            // cheerio.load 用字符串作为参数返回一个可以查询的特殊对象
            // body 就是 html 内容
            var e = cheerio.load(body)
            var movies = []
            // 查询对象的查询语法和 DOM API 中的 querySelector 一样
            var movieDivs = e('.item')
            for(let i = 0; i < movieDivs.length; i++) {
                let element = movieDivs[i]
                // 获取 div 的元素并且用 movieFromDiv 解析
                // 然后加入 movies 数组中
                var div = e(element).html()
                var m = movieFromDiv(div)
                movies.push(m)
            }
            downloadCovers(movies)
            saveMovies(movies)
        } else {
            log('*** ERROR 请求失败 ', error)
        }
    })
}


//多页抓取
var MoviesAll = function () {
    for (var i = 0; i < 250; i = i + 25) {
        var url =`
        https://movie.douban.com/top250?start=${i}&filter=
        `
        moviesFromUrl(url)
    }
}


var __main = function() {
    // 这是主函数
    // 下载网页, 解析出电影信息, 保存到文件
    MoviesAll()
}

__main()

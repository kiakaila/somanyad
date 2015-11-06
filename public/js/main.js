$(document).ready(function() {

  // Place JavaScript code here...
  $("#expireAt").text( moment().format("YYYY-MM-DD hello") );

  // 切换到用户指定的流量包类型
  if (huiyuantype = window.location.hash.substr(1)) {
    $("#huiyuan li").removeClass("active");
    // add class to the one we clicked
    var $navSel = $("#huiyuan li[huiyuantype='"+ huiyuantype + "']")
    $navSel.addClass("active");
    $(".feePlan .feeContent > div").addClass("hidden");
    var sel = ".feePlan .feeContent " + "#" + $navSel.attr("huiyuantype");
    $(sel).removeClass("hidden");
  }

  // 处理流量包价格页的流量包类型选择
  $("#huiyuan li").click(function() {
    // remove classes from all
    $("#huiyuan li").removeClass("active");
    // add class to the one we clicked
    $(this).addClass("active");
    $(".feePlan .feeContent > div").addClass("hidden");
    var sel = ".feePlan .feeContent " + "#" + $(this).attr("huiyuantype");

    $(sel).removeClass("hidden");
  });

  var currentPlan_expireAt = parseInt($("#currentPlan_expireAt").text()) || (new Date()).getTime()
  var now = moment.utc(currentPlan_expireAt);
  var nextD = moment.utc(currentPlan_expireAt).subtract(-1, "years").subtract(1, "days");

  console.log(now, "JJJJJJ");
  var fee_text = "" + moment().format("YYYY-MM-DD") + "  ----  " + moment().subtract(-9, "days").format("YYYY-MM-DD")
  var pay_text = "" + now.format("YYYY-MM-DD") + "  ----  " + nextD.format("YYYY-MM-DD")
  $("#free .duration").text( fee_text )
  $("#pay .duration").text( pay_text );

  $("#pay input").on("input", function () {
    var count = $(this).val() || 1;
    var price = count * 10;
    $("#pay .shouldPay").text( price + "元(每年10元)")

    var nextD = moment.utc(currentPlan_expireAt).subtract(-count, "years").subtract(1, "days");
    $("#pay .duration").text( "" + now.format("YYYY-MM-DD") + "  ----  " + nextD.format("YYYY-MM-DD"));
  });
});


function copyToClipboard(text) {
  window.prompt("请按下组合键: ctrl + c, 接着回车", text);
}

//
// $(document).ready(function () {
//   // Get the context of the canvas element we want to select
//   var ctx = document.getElementById("myChart").getContext("2d");
//
//   var path = window.location.pathname;
//   if (path != "/members") {
//     return;
//   }
//
//   // 请求json 数据
//   // 显示json 数据
//   var url = window.location.href + "/forwardCount";
//   $.getJSON(url, function (results) {
//
//     if (results.length == 0) {
//       $("#record").text("暂无记录")
//       return;
//     }
//     var labels = results.map(function (elem) {
//       return elem._id
//     })
//     var datas = results.map(function (elem) {
//       return elem.count
//     })
//     var data = {
//       // labels: ["January", "February", "March", "April", "May", "June", "July"],
//       labels: labels,
//       datasets: [
//           {
//               label: "My Second dataset",
//               fillColor: "rgba(151,187,205,0.2)",
//               strokeColor: "rgba(151,187,205,1)",
//               pointColor: "rgba(151,187,205,1)",
//               pointStrokeColor: "#fff",
//               pointHighlightFill: "#fff",
//               pointHighlightStroke: "rgba(151,187,205,1)",
//               // data: [28, 48, 40, 19, 86, 27, 90]
//               data: datas
//           }
//       ]
//     };
//     var opt = {
//       multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>"
//     }
//     var myNewChart = new Chart(ctx).Line(data, opt);
//   })
// })

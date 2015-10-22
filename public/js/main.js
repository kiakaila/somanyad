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

  var now = moment();
  var nextD = moment().subtract(-1, "years");

  [$("#free .duration"), $("#pay .duration")].forEach(function ($elem) {

    $elem.text( "" + now.format("YYYY-MM-DD") + "  ----  " + nextD.format("YYYY-MM-DD"));
  });

  $("#pay input").on("input", function () {
    var count = $(this).val() || 1;
    var price = count * 10;
    $("#pay .shouldPay").text( price + "元(每年10元)")

    var nextD = moment().subtract(-count, "years");
    $("#pay .duration").text( "" + now.format("YYYY-MM-DD") + "  ----  " + nextD.format("YYYY-MM-DD"));
  });

});

$(document).ready(function () {
  // Get the context of the canvas element we want to select
  var ctx = document.getElementById("myChart").getContext("2d");

  var ls = [];
  for (var i = 0; i < 15; i++) {
    ls.push(i);
  }
  var ls2 = ls.map(function (elem) {
    return elem * Math.random()
  })
  var data = {
    // labels: ["January", "February", "March", "April", "May", "June", "July"],
    labels: ls,
    datasets: [
        {
            label: "My Second dataset",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            // data: [28, 48, 40, 19, 86, 27, 90]
            data: ls2
        }
    ]
  };
  var opt = {
    multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>"
  }
  var myNewChart = new Chart(ctx).Line(data, opt);
})

function copyToClipboard(text) {
  window.prompt("请按下组合键: ctrl + c, 接着回车", text);
}

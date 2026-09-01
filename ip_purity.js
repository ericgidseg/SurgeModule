/*
 * IP Purity panel for Surge.
 * Data source: https://my.ippure.com/v1/info
 */

var API_URL = "https://my.ippure.com/v1/info";
var REFRESH_MINUTES = 10;

function valueOr(value, fallback) {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function maskIp(ip) {
  if (!ip) return "未知";

  if (ip.indexOf(":") !== -1) {
    var ipv6Parts = ip.split(":");
    if (ipv6Parts.length < 3) return ip;
    return ipv6Parts[0] + ":" + ipv6Parts[1] + ":••••:" + ipv6Parts[ipv6Parts.length - 1];
  }

  var parts = ip.split(".");
  if (parts.length !== 4) return ip;
  return parts[0] + "." + parts[1] + ".••••." + parts[3];
}

function flagFor(countryCode, apiFlag) {
  if (apiFlag) return apiFlag;
  if (!countryCode || countryCode.length !== 2) return "🌐";

  var code = countryCode.toUpperCase();
  var first = 127397 + code.charCodeAt(0);
  var second = 127397 + code.charCodeAt(1);
  if (String.fromCodePoint) return String.fromCodePoint(first, second);
  return String.fromCharCode(first, second);
}

function networkType(data) {
  if (data.isResidential === true || data.isResidential === "true") return "住宅/家宽";
  if (data.isBroadcast === true || data.isBroadcast === "true") return "广播/共享";
  return "数据中心/托管";
}

function riskFor(data) {
  var score = Number(data.fraudScore);
  if (!isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskLabel(score) {
  if (score <= 20) return { text: "低风险", english: "LOW RISK", color: "#159447" };
  if (score <= 50) return { text: "中风险", english: "MEDIUM RISK", color: "#c27a00" };
  return { text: "高风险", english: "HIGH RISK", color: "#d64242" };
}

function render(data) {
  var score = riskFor(data);
  if (score === null) return fail("IPPure 未返回 fraudScore");
  var risk = riskLabel(score);
  var asn = valueOr(data.asn, "未知");
  if (String(asn).indexOf("AS") !== 0) asn = "AS" + asn;
  var city = valueOr(data.city, "未知");
  var flag = flagFor(data.countryCode);
  var ipType = data.ip && data.ip.indexOf(":") !== -1 ? "IPv6" : "IPv4";
  var ip = maskIp(data.ip);

  var lines = [
    "✅ IP PURITY                 ● " + risk.english,
    "",
    "RISK SCORE              位置 " + flag,
    "" + score + "                      " + city,
    risk.text + "                  ASN " + asn,
    "                         类型 " + networkType(data),
    "",
    "🌐  " + ipType + "  " + ip,
    "",
    "◷  每 " + REFRESH_MINUTES + " 分钟刷新          更新于刚刚"
  ];

  return {
    title: "IP Purity",
    content: lines.join("\n"),
    icon: "checkmark.seal.fill",
    "icon-color": risk.color
  };
}

function fail(error, status) {
  var detail = error ? String(error) : "接口返回异常";
  if (status) detail += " (HTTP " + status + ")";

  return {
    title: "IP Purity",
    content: "⚠️  暂时无法获取 IP 信息\n\n" + detail + "\n\n请稍后重试。",
    icon: "exclamationmark.triangle.fill",
    "icon-color": "#d64242"
  };
}

$httpClient.get({
  url: API_URL,
  headers: {
    "Accept": "application/json",
    "User-Agent": "Surge IP Purity Panel"
  }
}, function (error, response, body) {
  if (error || !response || response.status < 200 || response.status >= 300) {
    $done(fail(error, response && response.status));
    return;
  }

  try {
    var data = JSON.parse(body);
    if (!data || data.error || !data.ip) {
      $done(fail(data && (data.message || data.error) || "IPPure 接口返回失败"));
      return;
    }
    $done(render(data));
  } catch (parseError) {
    $done(fail("响应解析失败"));
  }
});

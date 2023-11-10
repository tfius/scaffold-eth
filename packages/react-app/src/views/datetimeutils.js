export function getTimestampFromDate(date) {
  //var myDate = "26-02-2012";
  var myDate = getDateString(date);
  myDate = myDate.split("-");
  //var newDate = new Date(myDate[2], myDate[1] - 1, myDate[0]);
  var newDate = new Date(myDate[0], myDate[1] - 1, myDate[2]);
  return newDate.getTime() / 1000;
}
export function getDayName(timestamp, locale = "en-US") {
  var date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, { weekday: "long" });
}
export function getMonthName(timestamp, locale = "en-US") {
  var date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, { month: "long" });
}
export function getMonthDay(timestamp, locale = "en-US") {
  var date = new Date(timestamp * 1000);
  return ("0" + date.getDate()).slice(-2);
}
export function getYear(timestamp, locale = "en-US") {
  var date = new Date(timestamp * 1000);
  return "" + date.getFullYear();
}
export function getTimestampForDay(year, month, day) {
  const date = new Date(year, month - 1, day);
  return Math.floor(date.getTime() / 1000);
}
export function getDateString(timestamp) {
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert from seconds to milliseconds
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Add leading zero if necessary
  const day = ("0" + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}
export function getDateTimeString(timestamp) {
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert from seconds to milliseconds
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Add leading zero if necessary
  const day = ("0" + date.getDate()).slice(-2);
  const hours = ("0" + date.getHours()).slice(-2);
  const minutes = ("0" + date.getMinutes()).slice(-2);
  const seconds = ("0" + date.getSeconds()).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function getTimeString(time) {
  //console.log(time);
  var h = Math.floor(time / 3600);
  var m = Math.floor((time % 3600) / 60);
  var s = Math.floor((time % 3600) % 60);
  return `${h}:${m}`;
}
export function getDurationString(duration) {
  var m = duration / 60;
  return `${m}`;
}
// format number with postfix
export function formatNumber(num) {
  if (num < 1000) {
    return num.toString(); // Return the number as is if it's less than 1000
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1) + "k"; // Convert to 'k' for thousands
  } else {
    return (num / 1000000).toFixed(1) + "M"; // Convert to 'M' for millions
  }
}
export function timeAgo(timestamp) {
  const now = new Date().getTime();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return `${seconds} secs`;
  } else if (minutes < 60) {
    return `${minutes} mins`;
  } else if (hours < 24) {
    return `${hours} h`;
  } else if (days < 365) {
    return `${days} days`;
  }
  else {
    return `${years} years`;
  }
}
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

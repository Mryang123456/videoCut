//日期字符串转成时间戳
function dateStrChangeTimeTamp(dateStr) {
    dateStr = dateStr.substring(0, 23);
    dateStr = dateStr.replace(/-/g, '/');
    let timeTamp = new Date(dateStr).getTime();
    return timeTamp
}
// 精准到毫秒
function getNowTime(val) {
    const date = new Date(val)
    const hour = (date.getHours() - 8) < 10 ? '0' + (date.getHours() - 8) : date.getHours() - 8
    const minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
    const second = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()
    const milliSeconds = date.getMilliseconds() //毫秒
    const currentTime = hour + ':' + minute + ':' + second + '.' + milliSeconds
        // console.log(currentTime, val)
    return currentTime
}
export {dateStrChangeTimeTamp,getNowTime}

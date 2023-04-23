export function clearEmpty(val) {
    val = val.replace('', '')
    if (val.indexOf('') !== -1) {
        return clearEmpty(val)
    } else {
        return val
    }
}
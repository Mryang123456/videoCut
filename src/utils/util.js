const filterType = ['audio','video','image']
const fontExt = ['ttc','ttf','fon']
export function checkMediaFile(file) {
    let status = false
    filterType.forEach(type => {
        if(file.type.toLowerCase().indexOf(type) !== -1) {
            status = true
        }
    })
    return status
}

export function checkFontFile(file) {
    if(file.type){
        return false
    }
    let status = false
    let nameSplit = file.name.split('.')
    let fileExt = nameSplit[nameSplit.length-1].toLowerCase()
    fontExt.forEach(type => {
        if(fileExt.indexOf(type) !== -1) {
            status = true
        }
    })
    return status
}

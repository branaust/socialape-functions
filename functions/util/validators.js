const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false
}
const isEmail = (email) => {
    const regEx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    if (email.match(regEx)) return true;
    else return false
}

exports.validateSignupData = (data) => {
    let errors = {}
    // Check for valid email
    if (isEmpty(data.email)) {
        errors.email = 'Field required'
    } else if (!isEmail(data.email)) {
        errors.email = 'Must be a valid email address'
    }
    // Check for valid password
    if (isEmpty(data.password)) {
        errors.password = 'Field required'
    }
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords must match'
    }
    // Check for valid handle
    if (isEmpty(data.handle)) {
        errors.handle = 'Field required'
    }
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    let errors = {}

    if (isEmpty(data.email)) errors.email = "Field required"
    if (isEmpty(data.password)) errors.password = "Field required"

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}
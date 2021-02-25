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

exports.reduceUserDetails = (data) => {
    let userDetails = {}
    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio
    if (!isEmpty(data.website.trim())) {
        if (data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`
        } else userDetails.website = data.website
    }
    if (!isEmpty(data.location.trim())) userDetails.location = data.location

    return userDetails
}
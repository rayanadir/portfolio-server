module.exports.signUpErrors = (err) => {
    let errors={
        username:"",
        email:"",
        password:"",
    };
    if(err.message.includes("username"))
        errors.username="Username already exists or incorrect";
    if(err.message.includes("email"))
        errors.email="Incorrect email";
    if(err.message.includes("password"))
        errors.password="Password must be at least 6 characters";
    if(err.code === 11000 && Object.keys(err.keyValue)[0].includes("username"));
        errors.username = "Username already exists";
    if(err.code === 11000 && Object.keys(err.keyValue)[0].includes("email"))
        errors.email = "Email is already registered";
    return errors; 
}

module.exports.signInErrors = (err) => {
    let errors = {
        email:"",
        password: "",
    }

    if(err.message.includes('email'))
        errors.email="Unknown email"
    if(err.message.includes('password'))
        errors.password="Incorrect password"
    return errors;
}
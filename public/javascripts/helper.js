function checkToken() {
    if (!localStorage.getItem('token')) {
        window.location.replace('/login.html')
    } else {
        return localStorage.getItem('token')
    }
}

function getUsername() {
    if (!localStorage.getItem('username')) {
        window.location.replace('/login.html')
    } else {
        return localStorage.getItem('username')
    }
}

function logout() {
    localStorage.clear()
    window.location.replace('/login.html')
}

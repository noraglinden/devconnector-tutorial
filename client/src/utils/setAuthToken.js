import axios from 'axios'

const setAuthToken = token => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token
  } else {
    delete axios.defaults.headers.common['x-auth-token']
  }
}

//todo can i just put export default by the const?
export default setAuthToken

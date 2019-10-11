import axios from 'axios'
import { setAlert } from './alert'
import { GET_PROFILE, PROFILE_ERROR } from './types'

// get current user's profile
export const getCurrentProfile = () => async dispatch => {
  try {
    const config = {
      Authorization:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNWQ5ZTBmZWViYTVjZWI3YmRiZjE3MDJmIn0sImlhdCI6MTU3MDgzMzE0MywiZXhwIjoxNjA2ODMzMTQzfQ.QwYnK6ubLxdctDVxbTYVt11Pygj1EA4A2Rvr_oIaayI'
    }
    const res = await axios.get('/api/profile/me', config)
    dispatch({ type: GET_PROFILE, payload: res.data })
  } catch (err) {
    dispatch({
      type: PROFILE_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status }
    })
  }
}

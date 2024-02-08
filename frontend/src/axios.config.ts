import axios from "axios";

axios.defaults.baseURL = COMMON_BASE_URL + ':3000'
axios.defaults.withCredentials = true

export default axios
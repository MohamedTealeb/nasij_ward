import axios from "axios";
import { OrderModel } from "../../config/models/order.model.js";
import { ShipmentModel } from "../../config/models/shipment.js";
import { asyncHandler, successResponse } from "../../utils/response.js";
const OTO_BASE_URL = process.env.OTO_BASE_URL || "https://staging-api.tryoto.com/rest/v2";
export const getOtoAccessToken =async() => {
  const refreshToken = process.env.OTO_API_KEY;
  if (!refreshToken) throw new Error("Missing OTO_API_KEY in .env");
  try {
     console.log(refreshToken);
    const resp = await axios.post(
      `${OTO_BASE_URL}/refreshToken`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    const token = resp.data?.access_token;
    if (!token) throw new Error("Failed to retrieve access token from OTO API");
    return token;
  } catch (err) {
    console.error("Error fetching OTO access token:", err.message);
    throw new Error("Could not get OTO access token");
  }
};
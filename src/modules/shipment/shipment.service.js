import axios from "axios";
import { OrderModel } from "../../config/models/order.model.js";
import { ShipmentModel } from "../../config/models/shipment.js";
import { asyncHandler, successResponse } from "../../utils/response.js";

export const getOtoAccessToken =async() => {
  const refreshToken = process.env.OTO_API_KEY;
  if (!refreshToken) throw new Error("Missing OTO_API_KEY in .env");
  try {
     console.log(refreshToken);
    const resp = await axios.post(
      `${process.env.OTO_API_BASE}/rest/v2/refreshToken`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    const token = resp.data?.access_token;
    if (!token) throw new Error("Failed to retrieve access token from OTO API");
    console.log(token);
    return token;
  } catch (err) {
    console.error("Error fetching OTO access token:", err.message);
    throw new Error("Could not get OTO access token");
  }
};

export const createOtoProduct = async ({
  name,
  sku,
  price,
  description = "",
  categoryName = "",
  image = "",
  taxAmount = 0,
}) => {
  if (!name || !sku || price === undefined) {
    throw new Error("Missing required product data for OTO payload");
  }

  const token = await getOtoAccessToken();
  const payload = {
    productName: name,
    sku,
    price,
    taxAmount,
    description,
    category: categoryName,
    image,
  };

  try {
    const response = await axios.post(`${process.env.OTO_API_BASE}/rest/v2/createProduct`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error("Error creating OTO product:", err?.response?.data || err.message);
    throw new Error("Failed to create product in OTO");
  }
};

export const createOtoOrder = async ({
  orderId,
  createShipment,
  deliveryOptionId,
  address,
  amount,
  status,
  estimatedDelivery,
  trackingNumber,
  carrier,
  otoOrderId,
  otoAccessToken,
}) => {
  const token = await getOtoAccessToken();
}
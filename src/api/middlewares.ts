import { defineMiddlewares } from "@medusajs/framework/http"
import { adminCourierMiddlewares } from "./admin/couriers/middlewares"
import { storeOfficesMiddlewares } from "./store/couriers/offices/middlewares"

export default defineMiddlewares({
  routes: [...adminCourierMiddlewares, ...storeOfficesMiddlewares],
})

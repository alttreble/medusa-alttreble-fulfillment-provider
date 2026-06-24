import { Module } from "@medusajs/framework/utils"
import CourierModuleService from "./service"

export const COURIER_MODULE = "courier"

export default Module(COURIER_MODULE, {
  service: CourierModuleService,
})

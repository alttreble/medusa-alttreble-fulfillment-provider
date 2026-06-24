import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { CalculatedShippingOptionPrice, CalculateShippingOptionPriceDTO, CreateFulfillmentResult, CreateShippingOptionDTO, FulfillmentOption, Logger } from "@medusajs/framework/types"

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  url: string
  username: string
  password: string
}

class DPDFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "dpd-fulfillment"
  protected logger: Logger
  protected options: Options

  constructor(
    { logger }: InjectedDependencies,
    options: Options
  ) {
    super()

    this.logger = logger
    this.options = options
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    this.logger.info(JSON.stringify({
      optionData,
      data,
      context,
    }, null, 2));
    return {
      calculated_amount: 11,
      // Update this boolean value based on your logic
      is_calculated_price_tax_inclusive: true,
    }
  }

  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    return true
  }

  async createFulfillment(
    data: any,
    items: any,
    order: any,
    fulfillment: any
  ): Promise<CreateFulfillmentResult> {

    const trackingNumber = "123"
    const trackingUrl = `https://tracking.dpd.com/123`
    const labelUrl = `https://label.dpd.com/123`

    return {
      labels: [{
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        label_url: labelUrl,
      }],
      data: {
        external_id: "dpd_123",
      }
    }
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    // assuming you have a client

    return [
      {
        id: "dpd-office-pickup",
        name: "DPD Fulfillment Office Pickup",
      }
    ]
  }

  async validateFulfillmentData(
    optionData: any,
    data: any,
    context: any
  ): Promise<any> {
    return {
      ...data,
    }
  }

  async validateOption(data: any): Promise<boolean> {
    return true
  }

}

export default DPDFulfillmentProviderService

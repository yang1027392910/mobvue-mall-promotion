export type CalculatorTab = "product" | "weight"

export interface CalculatorTabOption {
  label: string
  value: CalculatorTab
}

export interface CalculatorInputRow {
  label: string
  control?: "field" | "stepper"
  value?: string
  numericValue?: number
  min?: number
  editable?: boolean
  locked?: boolean
  sectionTitle?: string
  dividerBefore?: boolean
  placeholder?: string
  unit: string
  helper?: string
}

export interface CalculatorResultRow {
  label: string
  value?: string
  numericValue?: number
  prefix?: string
  suffix?: string
  decimals?: number
  note?: string
  tone?: "primary" | "success" | "warning"
}

// extends "Aide" type defined in "aides-velo" package
type Aide = {
  title: string
  description: string
  url: string
  amount?: number
}

export interface benefitLayout {
  label: string
  montant: any
}

export interface benefitVeloLayout extends Aide {
  collectivity?: {
    id: string
    kind: string
    value: string
    code: string
  }
  institution?: string
  discard?: boolean
  id?: string
}

/** HubSpot Contact entity matching the HubSpot API response shape */
export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    lifecyclestage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** HubSpot Deal entity matching the HubSpot API response shape */
export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount?: string;
    dealstage: string;
    pipeline: string;
    closedate?: string;
    hubspot_owner_id?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** HubSpot Note (engagement) entity matching the HubSpot API response shape */
export interface HubSpotNote {
  id: string;
  properties: {
    hs_note_body: string;
    hs_timestamp: string;
    hubspot_owner_id?: string;
  };
  associations?: {
    contacts?: Array<{ id: string }>;
    deals?: Array<{ id: string }>;
  };
  createdAt: string;
  updatedAt: string;
}

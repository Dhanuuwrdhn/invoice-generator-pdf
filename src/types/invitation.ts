export interface Invitation {
  id: string;
  slug: string;
  created_at: string;

  // Couple
  bride_name: string;
  groom_name: string;
  bride_parents: string;
  groom_parents: string;

  // Events
  akad_date: string;
  akad_time: string;
  akad_venue: string;
  akad_address: string;
  reception_date: string;
  reception_time: string;
  reception_venue: string;
  reception_address: string;

  // Content
  opening_message: string;
  closing_message: string;

  // Appearance
  primary_color: string;
  cover_image_url: string;
  music_url: string;
}

export type InvitationInsert = Omit<Invitation, 'id' | 'created_at'>;

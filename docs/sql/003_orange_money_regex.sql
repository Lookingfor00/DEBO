-- Live Orange Money receive-SMS regexes (OFM MALI).
-- Apply on instance ai-scrapper. Does not touch engine tables.

update jobboard.payment_methods
set
  display_name = 'Orange Money',
  identify_regex = $$(?i)OFM MALI$$,
  amount_regex = $$(?i)transfert de ([0-9][0-9 ]*) FCFA$$,
  reference_regex = $$ID:\s*([A-Z0-9]+(?:\.[A-Z0-9]+)*)$$,
  sender_regex = $$(?i) du (\d{8,})$$,
  enabled = true,
  updated_at = now()
where slug = 'orange_money';

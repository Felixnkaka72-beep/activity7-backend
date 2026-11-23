-- Adds eight made-up records ONCE. If you later delete them all, they do not come back.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM seed_status WHERE name = 'records') THEN
    IF NOT EXISTS (SELECT 1 FROM records) THEN
      INSERT INTO records (title, category, description, status) VALUES
        ('Broken classroom light',   'Electrical', 'The light in Room B12 does not switch on.',           'Pending'),
        ('Leaking tap in toilets',   'Plumbing',   'The tap in the ground floor toilets drips all day.',  'In progress'),
        ('Broken lecture chair',     'Furniture',  'Two chairs in Lecture Hall 3 have loose legs.',       'Pending'),
        ('Flickering corridor lamp', 'Electrical', 'The lamp outside the library flickers at night.',     'Completed'),
        ('Blocked sink in lab',      'Plumbing',   'The sink in Computer Lab 2 drains very slowly.',      'In progress'),
        ('Wobbly desk',              'Furniture',  'A desk in Room A4 rocks when students write.',        'Completed'),
        ('Dead power socket',        'Electrical', 'The socket near the projector gives no power.',       'Pending'),
        ('Burst pipe near hostel',   'Plumbing',   'Water is leaking from a pipe beside Hostel Block C.', 'In progress');
    END IF;
    INSERT INTO seed_status (name) VALUES ('records');
  END IF;
END $$;

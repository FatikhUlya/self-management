const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejbtjcaxfjuoedytagrp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqYnRqY2F4Zmp1b2VkeXRhZ3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTc1NDMsImV4cCI6MjA5OTMzMzU0M30.qerzASmRzU2Fyd1ry-19BadRTm4XWUU2GYDUPpwM9JM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching plans...');
  const { data: plans, error } = await supabase.from('next_day_plans').select('*');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${plans.length} plans in database.`);
  
  // Group plans by date, title, start_time
  const groups = {};
  for (const p of plans) {
    const key = `${p.date}_${p.title}_${p.start_time}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(p);
  }
  
  const idsToDelete = [];
  for (const key in groups) {
    const list = groups[key];
    if (list.length > 1) {
      console.log(`Group ${key} has ${list.length} entries.`);
      // Sort by created_at (ascending) or id, keep the first one, delete the rest
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      for (let i = 1; i < list.length; i++) {
        idsToDelete.push(list[i].id);
      }
    }
  }
  
  if (idsToDelete.length === 0) {
    console.log('No duplicates found.');
    return;
  }
  
  console.log(`Deleting ${idsToDelete.length} duplicates...`);
  // Delete in chunks of 100
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const chunk = idsToDelete.slice(i, i + 100);
    const { error: delError } = await supabase.from('next_day_plans').delete().in('id', chunk);
    if (delError) {
      console.error('Delete error:', delError);
    } else {
      console.log(`Deleted chunk ${i} to ${i + chunk.length}`);
    }
  }
  
  console.log('Done!');
}

run();

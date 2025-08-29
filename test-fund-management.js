#!/usr/bin/env node
require('dotenv').config({ path: './backend/.env' });
const { supabaseAdmin } = require('./backend/lib/supabaseAdmin');

async function testFundManagement() {
  console.log('🧪 Testing fund management APIs...');
  
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available - check environment variables');
    process.exit(1);
  }

  try {
    const userId = 'user123';
    const currency = 'USDT';
    
    console.log('📊 Current portfolio state:');
    const { data: currentPortfolio } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);
    
    console.log('Current balances:', currentPortfolio);
    
    // Test recharge
    console.log('\n💰 Testing recharge...');
    const rechargeAmount = 1000;
    
    const { data: pf } = await supabaseAdmin
      .from('portfolios')
      .upsert(
        { user_id: userId, currency, balance: 0 },
        { onConflict: 'user_id,currency', ignoreDuplicates: false }
      )
      .select()
      .single();

    const newBalance = Number(pf.balance) + rechargeAmount;
    await supabaseAdmin
      .from('portfolios')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .eq('currency', currency);

    // Record transaction
    await supabaseAdmin
      .from('fund_transactions')
      .insert({
        user_id: userId,
        currency,
        amount: rechargeAmount,
        type: 'RECHARGE',
        created_by: 'admin'
      });

    console.log(`✅ Recharged ${rechargeAmount} ${currency}`);
    
    // Test withdraw
    console.log('\n💸 Testing withdraw...');
    const withdrawAmount = 500;
    
    const { data: currentPf } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', currency)
      .single();

    if (Number(currentPf.balance) < withdrawAmount) {
      console.log('❌ Insufficient balance for withdrawal');
    } else {
      const updatedBalance = Number(currentPf.balance) - withdrawAmount;
      await supabaseAdmin
        .from('portfolios')
        .update({ balance: updatedBalance })
        .eq('user_id', userId)
        .eq('currency', currency);

      // Record transaction
      await supabaseAdmin
        .from('fund_transactions')
        .insert({
          user_id: userId,
          currency,
          amount: -withdrawAmount,
          type: 'WITHDRAW',
          created_by: 'admin'
        });

      console.log(`✅ Withdrew ${withdrawAmount} ${currency}`);
    }
    
    // Show final state
    console.log('\n📊 Final portfolio state:');
    const { data: finalPortfolio } = await supabaseAdmin
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);
    
    console.log('Final balances:', finalPortfolio);
    
    // Show transactions
    console.log('\n📋 Recent transactions:');
    const { data: transactions } = await supabaseAdmin
      .from('fund_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    transactions.forEach(tx => {
      console.log(`${tx.type}: ${tx.amount} ${tx.currency} at ${tx.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testFundManagement();

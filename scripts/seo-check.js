#!/usr/bin/env node

/**
 * SEO Validation Check Script
 * Runs comprehensive SEO tests and provides a summary report
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Running SEO Validation Tests...\n');

try {
  // Run SEO tests
  const output = execSync('npm test src/__tests__/seo', {
    encoding: 'utf-8',
    stdio: 'pipe',
  });

  console.log(output);

  // Parse test results
  const passedMatch = output.match(/(\d+) passed/);
  const failedMatch = output.match(/(\d+) failed/);
  
  const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  const total = passed + failed;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log('\n' + '='.repeat(60));
  console.log('📊 SEO VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(`📈 SEO Score: ${score}%`);
  console.log('='.repeat(60));

  if (score >= 95) {
    console.log('\n🎉 Excellent! Your SEO implementation meets best practices.');
    console.log('   Ready for production deployment.');
  } else if (score >= 80) {
    console.log('\n⚠️  Good, but there are some issues to address.');
    console.log('   Review failed tests and fix before deployment.');
  } else {
    console.log('\n❌ SEO implementation needs significant improvements.');
    console.log('   Please review and fix failed tests.');
  }

  console.log('\n📚 Next Steps:');
  console.log('   1. Review docs/SEO_TESTING.md for manual testing');
  console.log('   2. Test with Google Rich Results Test');
  console.log('   3. Validate with Facebook Sharing Debugger');
  console.log('   4. Run Lighthouse SEO audit');
  console.log('   5. Submit sitemap to Google Search Console\n');

  process.exit(failed > 0 ? 1 : 0);
} catch (error) {
  console.error('❌ Error running SEO tests:', error.message);
  process.exit(1);
}

import { expect, test } from '@playwright/test';

test('ouvre le lab DVWA et suit les étapes de progression', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Laboratoires/ }).click();
  await page.getByRole('button', { name: 'DVWA', exact: true }).click();
  await page.getByRole('button', { name: 'Démarrer le lab' }).first().click();

  const lab = page.getByRole('region', { name: 'Laboratoire SQL Injection' });
  await expect(lab.getByRole('heading', { name: 'SQL Injection' })).toBeVisible();
  const launch = lab.getByRole('link', { name: 'Ouvrir SQL Injection dans DVWA' });
  await expect(launch).toHaveAttribute('href', 'https://dvwa.ya-consulting.com/vulnerabilities/sqli/');
  await expect(launch).toHaveAttribute('target', '_blank');

  await lab.getByRole('button', { name: 'J’ai ouvert cet exercice DVWA avec ma session de formation.' }).click();
  await expect(lab.locator('.dvwa-progress-line')).toContainText('35%');
  await lab.getByRole('button', { name: 'J’ai réalisé le scénario autorisé dans DVWA.' }).click();
  await lab.getByRole('button', { name: 'J’ai identifié la contre-mesure et son effet.' }).click();
  await expect(lab.locator('.dvwa-progress-line')).toContainText('100%');
  await expect(lab.getByText(/Laboratoire validé/)).toBeVisible();

  await lab.getByRole('button', { name: 'Tous les laboratoires' }).click();
  await expect(page.getByRole('button', { name: 'Revoir le lab' }).first()).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Laboratoires/ }).click();
  await expect(page.getByRole('button', { name: 'Revoir le lab' }).first()).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('n’affiche une réussite DVWA qu’après réception d’un résultat signé', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Laboratoires/ }).click();
  await page.getByRole('button', { name: 'DVWA', exact: true }).click();
  await page.getByRole('button', { name: 'Démarrer le lab' }).first().click();

  const lab = page.getByRole('region', { name: 'Laboratoire SQL Injection' });
  await expect(lab.getByRole('heading', { name: 'SQL Injection' })).toBeVisible();
  const launch = lab.getByRole('link', { name: 'Ouvrir SQL Injection dans DVWA' });
  await expect(launch).toHaveAttribute('href', 'https://dvwa.ya-consulting.com/vulnerabilities/sqli/');
  await expect(launch).toHaveAttribute('target', '_blank');
  await expect(lab.getByText('En attente d’un résultat signé')).toBeVisible();
  await expect(lab.locator('.dvwa-progress-line')).toContainText('0%');
  await expect(lab.getByText('aucune auto-déclaration')).toBeVisible();

  await lab.getByRole('button', { name: 'Tous les laboratoires' }).click();
  await expect(page.getByRole('button', { name: 'Démarrer le lab' }).first()).toBeVisible();
});

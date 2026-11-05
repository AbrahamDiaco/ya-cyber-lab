import { expect, test } from '@playwright/test';

test('exécute un lab DVWA simulé et retrouve sa progression', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Laboratoires/ }).click();

  await expect(page.getByRole('heading', { name: 'Laboratoires pratiques' })).toBeVisible();
  const overview = page.locator('.lab-progress-overview');
  await expect(overview.locator('.lab-overview-copy > b')).toContainText('0');
  await page.getByRole('button', { name: 'DVWA', exact: true }).click();
  await page.getByRole('button', { name: 'Démarrer le lab' }).first().click();

  const lab = page.getByRole('region', { name: 'Laboratoire SQL Injection' });
  await expect(lab.getByRole('heading', { name: 'SQL Injection' })).toBeVisible();
  await lab.getByLabel('Valeur de recherche').fill("' OR '1'='1");
  await lab.getByRole('button', { name: 'Lancer la simulation' }).click();
  await expect(lab.getByText('Objectif atteint')).toBeVisible();
  await expect(lab.getByText(/Aucune base de données n’a été contactée/)).toBeVisible();

  await lab.getByRole('button', { name: 'Tous les laboratoires' }).click();
  await expect(overview.locator('.lab-overview-copy > b')).toContainText('1');
  await expect(page.getByRole('button', { name: 'Revoir le lab' }).first()).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Laboratoires/ }).click();
  await expect(page.getByRole('button', { name: 'Revoir le lab' }).first()).toBeVisible();
});

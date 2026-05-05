import {
  listSavedIdeas,
  listSavedExamples,
  listSavedProducts,
  listSavedSalesAssets,
} from '@/app/actions/workflow';
import { VaultClient } from './vault-client';

export default async function SavedPage() {
  const [ideasResult, examplesResult, productsResult, salesAssetsResult] = await Promise.all([
    listSavedIdeas(),
    listSavedExamples(),
    listSavedProducts(),
    listSavedSalesAssets(),
  ]);

  return (
    <VaultClient
      ideas={ideasResult.data ?? []}
      examples={examplesResult.data ?? []}
      products={productsResult.data ?? []}
      salesAssets={salesAssetsResult.data ?? []}
    />
  );
}

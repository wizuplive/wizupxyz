import {
  listSavedIdeas,
  listSavedExamples,
  listSavedProducts,
  listSavedSalesAssets,
} from '@/app/actions/workflow';
import { SavedClient } from './saved-client';

export default async function SavedPage() {
  const [ideasResult, examplesResult, productsResult, salesAssetsResult] = await Promise.all([
    listSavedIdeas(),
    listSavedExamples(),
    listSavedProducts(),
    listSavedSalesAssets(),
  ]);

  return (
    <SavedClient
      ideas={ideasResult.data ?? []}
      examples={examplesResult.data ?? []}
      products={productsResult.data ?? []}
      salesAssets={salesAssetsResult.data ?? []}
    />
  );
}

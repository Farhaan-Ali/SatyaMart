import { supabase } from '@/integrations/supabase/client';

export const addSampleProduct = async (supplierId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: 'Sample Product',
        description: 'This is a sample product for testing purposes',
        unit_price: 99.99,
        stock_quantity: 50,
        min_stock_level: 10,
        status: 'active',
        sku: 'SAMPLE-001',
        supplier_id: supplierId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding sample product:', error);
    throw error;
  }
};

export const createSampleSupplier = async (userId: string) => {
  try {
    // First create supplier profile
    const { data: profileData, error: profileError } = await supabase
      .from('supplier_profiles')
      .insert({
        user_id: userId,
        full_name: 'Sample Supplier',
        business_name: 'Sample Business',
        business_type: 'Manufacturing',
        business_address: '123 Sample Street, Sample City',
        contact_number: '+1234567890',
        fssai_license: 'FSSAI123456',
        other_certifications: ['ISO 9001', 'HACCP']
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Then create supplier record
    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        user_id: userId,
        name: 'Sample Business',
        contact_email: 'sample@example.com',
        address: '123 Sample Street, Sample City',
        status: 'active'
      })
      .select()
      .single();

    if (supplierError) throw supplierError;

    return supplierData;
  } catch (error) {
    console.error('Error creating sample supplier:', error);
    throw error;
  }
};

export const setupSampleData = async (userId: string) => {
  try {
    // Create sample supplier
    const supplier = await createSampleSupplier(userId);
    
    // Add sample product
    const product = await addSampleProduct(supplier.id);
    
    return { supplier, product };
  } catch (error) {
    console.error('Error setting up sample data:', error);
    throw error;
  }
}; 
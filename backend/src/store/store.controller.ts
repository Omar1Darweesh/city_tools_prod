import { Controller, Get, Post, Body, Param, Query, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { StoreService } from './store.service';
import { DeliveryZonesService } from './delivery-zones.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStoreOrderDto } from './dto/create-order.dto';

@Controller('store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly deliveryZonesService: DeliveryZonesService,
    private readonly authService: AuthService,
  ) {}

  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login({
      username: body.email,
      password: body.password,
    });
    return {
      data: {
        token: result.accessToken,
        customer: result.user,
      },
    };
  }

  @Get('products/featured')
  async getFeatured() {
    return this.storeService.getFeatured();
  }

  @Get('products/best-selling')
  async getBestSelling() {
    return this.storeService.getBestSelling();
  }

  @Get('products/popular')
  async getPopular() {
    return this.storeService.getPopular();
  }

  @Get('products')
  async getProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('subcategoryIds') subcategoryIds?: string,
    @Query('subcategoryName') subcategoryName?: string,
    @Query('itemTypeId') itemTypeId?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('isPopular') isPopular?: string,
    @Query('isBestSale') isBestSale?: string,
    @Query('discounted') discounted?: string,
    @Query('badge') badge?: string,
    @Query('brand') brand?: string,
  ) {
    return this.storeService.getProducts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
      subcategoryIds: subcategoryIds
        ? subcategoryIds.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n) && n > 0)
        : undefined,
      subcategoryName: subcategoryName?.trim() || undefined,
      itemTypeId: itemTypeId ? Number(itemTypeId) : undefined,
      search,
      sort,
      isPopular: isPopular === 'true' ? true : undefined,
      isBestSale: isBestSale === 'true' ? true : undefined,
      discounted: discounted === 'true' ? true : undefined,
      badge,
      brand,
    });
  }

  @Get('products/:code')
  async getProduct(@Param('code') code: string) {
    return this.storeService.getProduct(code);
  }

  @Get('categories')
  async getCategories(@Query('subcategoryName') subcategoryName?: string) {
    return this.storeService.getCategories(subcategoryName?.trim() || undefined);
  }

  @Get('categories/:slug')
  async getCategory(@Param('slug') slug: string) {
    return this.storeService.getCategory(slug);
  }

  @Get('subcategories')
  async getSubcategories(@Query('categoryId') categoryId?: string) {
    return this.storeService.getSubcategories(categoryId ? Number(categoryId) : undefined);
  }

  @Get('item-types')
  async getItemTypes(@Query('subcategoryId') subcategoryId?: string) {
    return this.storeService.getItemTypes(subcategoryId ? Number(subcategoryId) : undefined);
  }

  @Get('brands')
  async getBrands(@Query('categoryId') categoryId?: string) {
    return this.storeService.getBrands(categoryId ? Number(categoryId) : undefined);
  }

  @Get('brands/trusted')
  async getTrustedBrands() {
    return this.storeService.getTrustedBrands();
  }

  @Get('brands/:id')
  async getBrand(@Param('id') id: string) {
    return this.storeService.getBrand(id);
  }

  @Post('brands')
  async createBrand(@Body() body: any) {
    return this.storeService.createBrand(body);
  }

  @Patch('brands/:id')
  async updateBrand(@Param('id') id: string, @Body() body: any) {
    return this.storeService.updateBrand(id, body);
  }

  @Delete('brands/:id')
  async deleteBrand(@Param('id') id: string) {
    return this.storeService.deleteBrand(id);
  }

  @Get('statistics')
  async getAllStatistics() {
    return this.storeService.getAllStatistics();
  }

  @Get('statistics/active')
  async getActiveStatistics() {
    return this.storeService.getActiveStatistics();
  }

  @Post('statistics')
  async createStatistic(@Body() body: any) {
    return this.storeService.createStatistic(body);
  }

  @Patch('statistics/:id')
  async updateStatistic(@Param('id') id: string, @Body() body: any) {
    return this.storeService.updateStatistic(Number(id), body);
  }

  @Delete('statistics/:id')
  async deleteStatistic(@Param('id') id: string) {
    return this.storeService.deleteStatistic(Number(id));
  }

  @Get('discount-cards')
  async getAllDiscountCards() {
    return this.storeService.getAllDiscountCards();
  }

  @Get('discount-cards/active')
  async getActiveDiscountCards() {
    return this.storeService.getActiveDiscountCards();
  }

  @Post('discount-cards')
  async createDiscountCard(@Body() body: any) {
    return this.storeService.createDiscountCard(body);
  }

  @Patch('discount-cards/:id')
  async updateDiscountCard(@Param('id') id: string, @Body() body: any) {
    return this.storeService.updateDiscountCard(Number(id), body);
  }

  @Delete('discount-cards/:id')
  async deleteDiscountCard(@Param('id') id: string) {
    return this.storeService.deleteDiscountCard(Number(id));
  }

  // ── Trust Features ──────────────────────────────────────────
  @Get('trust-features')
  async getAllTrustFeatures() {
    return this.storeService.getAllTrustFeatures();
  }

  @Get('trust-features/active')
  async getActiveTrustFeatures() {
    return this.storeService.getActiveTrustFeatures();
  }

  @Post('trust-features')
  async createTrustFeature(@Body() body: any) {
    return this.storeService.createTrustFeature(body);
  }

  @Patch('trust-features/:id')
  async updateTrustFeature(@Param('id') id: string, @Body() body: any) {
    return this.storeService.updateTrustFeature(Number(id), body);
  }

  @Delete('trust-features/:id')
  async deleteTrustFeature(@Param('id') id: string) {
    return this.storeService.deleteTrustFeature(Number(id));
  }

  // ── Hero Slides ──────────────────────────────────────────────
  @Get('hero-slides')
  async getAllHeroSlides() {
    return this.storeService.getAllHeroSlides();
  }

  @Get('hero-slides/active')
  async getActiveHeroSlides() {
    return this.storeService.getActiveHeroSlides();
  }

  @Post('hero-slides')
  async createHeroSlide(@Body() body: any) {
    return this.storeService.createHeroSlide(body);
  }

  @Patch('hero-slides/:id')
  async updateHeroSlide(@Param('id') id: string, @Body() body: any) {
    return this.storeService.updateHeroSlide(Number(id), body);
  }

  @Delete('hero-slides/:id')
  async deleteHeroSlide(@Param('id') id: string) {
    return this.storeService.deleteHeroSlide(Number(id));
  }

  // ── Footer Settings ─────────────────────────────────────────
  @Get('footer-settings')
  async getFooterSettings() {
    return this.storeService.getFooterSettings();
  }

  @Post('footer-settings')
  async createFooterSettings(@Body() body: any) {
    return this.storeService.updateFooterSettings(body);
  }

  @Patch('footer-settings')
  async updateFooterSettings(@Body() body: any) {
    return this.storeService.updateFooterSettings(body);
  }

  // ── Support Pages ─────────────────────────────────────────
  @Get('support-pages')
  async getSupportPages() {
    return this.storeService.getSupportPages();
  }

  @Post('support-pages')
  async createSupportPages(@Body() body: any) {
    return this.storeService.updateSupportPages(body);
  }

  @Patch('support-pages')
  async updateSupportPages(@Body() body: any) {
    return this.storeService.updateSupportPages(body);
  }

  // ── Delivery Zones ──────────────────────────────────────────
  @Get('delivery-zones')
  async getDeliveryZones(@Query('activeOnly') activeOnly?: string) {
    const zones = await this.deliveryZonesService.findAll(activeOnly === 'true');
    return { data: zones, success: true };
  }

  @Post('delivery-zones')
  async createDeliveryZone(@Body() body: { name: string; nameAr: string; fee: number; sortOrder?: number }) {
    const zone = await this.deliveryZonesService.create(body);
    return { data: zone, success: true };
  }

  @Patch('delivery-zones/:id')
  async updateDeliveryZone(
    @Param('id') id: string,
    @Body() body: { name?: string; nameAr?: string; fee?: number; active?: boolean; sortOrder?: number },
  ) {
    const zone = await this.deliveryZonesService.update(Number(id), body);
    return { data: zone, success: true };
  }

  @Delete('delivery-zones/:id')
  async deleteDeliveryZone(@Param('id') id: string) {
    return this.deliveryZonesService.remove(Number(id));
  }

  // ── Orders ──────────────────────────────────────────────────
  @Post('orders')
  async createOrder(@Body() body: CreateStoreOrderDto) {
    return this.storeService.createOrder(body);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getOrders(@Request() req: any) {
    return this.storeService.getOrders(req.user.userId);
  }
}

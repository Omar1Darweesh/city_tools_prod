import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
    { name: 'products:create', description: 'صلاحية إضافة منتجات جديدة' },
    { name: 'products:edit', description: 'صلاحية تعديل المنتجات' },
    { name: 'products:delete', description: 'صلاحية حذف المنتجات' },

    // Platform Access Permissions
    { name: 'platform:normal', description: 'البيع العادي (بدون منصة)' },
    { name: 'platform:noon', description: 'منصة نون' },
    { name: 'platform:amazon', description: 'منصة أمازون' },
    { name: 'platform:jumia', description: 'منصة جوميا' },
    { name: 'platform:social', description: 'مبيعات السوشيال ميديا' },
    { name: 'platform:pogba', description: 'منصة بوجبا' },
];

async function main() {
    console.log('Start seeding permissions...');

    for (const p of permissions) {
        const existing = await prisma.permission.findUnique({
            where: { name: p.name },
        });

        if (!existing) {
            await prisma.permission.create({
                data: p,
            });
            console.log(`Created permission: ${p.name}`);
        }
    }

    // Create Default Admin Role if not exists
    const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    if (adminRole) {
        const allPermissions = await prisma.permission.findMany();
        // Assign all permissions to Admin
        for (const p of allPermissions) {
            const exists = await prisma.rolePermission.findUnique({
                where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
            });
            if (!exists) {
                await prisma.rolePermission.create({
                    data: { roleId: adminRole.id, permissionId: p.id },
                });
            }
        }
        console.log('Assigned all permissions to Admin role');
    } else {
        // Create Admin Role
        const allPermissions = await prisma.permission.findMany();
        await prisma.role.create({
            data: {
                name: 'Admin',
                description: 'System Administrator',
                permissions: {
                    create: allPermissions.map((p: any) => ({
                        permission: { connect: { id: p.id } }
                    }))
                }
            }
        });
        console.log('Created Admin role with all permissions');
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

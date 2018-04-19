// @ flow

'use strict';

import Logger from '../utils/Logger';
import { Router }  from 'express';
import UserModels from '../models/user';
import bcrypt from 'bcryptjs';

type LoginParams = {
    username: string,
    password: string,
};

type CreateUserParams = {
    username: string,
    password: string,
    email: string,
};

const logger = new Logger();
const DB_ERROR = 'An error with the query has occurred.';

export default class UserRouter {
    // these fields must be type annotated, or Flow will complain!
    router: Router;
    path: string;

    // take the mount path as the constructor argument
    constructor(path = '/api/v1/user') {
        // instantiate the express.Router
        this.router = Router();
        this.path = path;
        // glue it all together
        this.init();
    }


    /**
    * Attach route handlers to their endpoints.
    */
    init(): void {
        this.router.post('/create', this.createUser);
        this.router.post('/validate', this.validateUser);
        this.router.post('/login', this.loginUser);
        this.router.post('/delete', this.deleteUser)
        this.router.post('/changePassword', this.changePassword);
        this.router.get('/logout', this.logout);
        this.router.get('/session', this.getSession);
    }

    getSession(req: $Request, res: $Response): void {
        if (!!req.session.key) {
            console.log(req.session.key['id']);
            return res.status(200).json({
                message: 'User is logged in',
                user_name: req.session.key.user_name,
            });
        } else {
            return res.status(401).json({
                message: 'User not logged in'
            })
        }
    }

    changePassword(req: $Request, res: $Response): void {
        const { body } = req;
        const userId : string = req.session.key['id'];
        const password : string = body.password;
        const newPassword : string = body.newPassword;
        let errorMsg : string = 'Incorrect password supplied.';

        UserModels.userDb.update({
            password: newPassword
        },{
            where: {
                id: userId,
                password: password,
            },
            returns: true,
        }).then((data) => {
            if (data[0] > 0) {
                return res.status(200).json({
                    message: 'Successfully changed password.',
                });
            } else {
                return res.status(400).json({
                    message: errorMsg,
                    error: err.message,
                });
            }
        }).catch((err) => {
            logger.error(errorMsg, err, err.message);
            return res.status(400).json({
                message: errorMsg,
                error: err.message,
            });
        });
    }

    loginUser(req: $Request, res: $Response): void {
        const { body } = req;
        const username : string = body.username;
        const password : string = body.password;
        let errorMsg : string = 'Invalid username or password.';

        UserModels.userDb.findOne({
            where: {
                user_name: username,
                password: password,
                active: true,
            }
        }).then((data) => {
            if (!!data) {
                req.session.key = data.dataValues;
                return res.status(200).json({
                    message: 'Login successful.',
                });
            } else {
                return res.status(400).json({
                    message: errorMsg,
                    error: err.message,
                });
            }
        }).catch((err) => {
            logger.error(errorMsg, err, err.message);
            return res.status(400).json({
                message: errorMsg,
                error: err.message,
            });
        });
    }

    logout(req: $Request, res: $Response): void {
        if (!!req.session.key) {
            delete req.session.key;
            return res.status(200).json({
                message: 'Successfully logged out.',
            });
        } else {
            return res.status(401).json({
                message: 'User not authenticated.'
            })
        }
    }

    deleteUser(req: $Request, res: $Response): void {
        const { body } = req;
        let errorMsg : string = 'User cannot be deleted.';

        if (!!req.session.key) {
            const userId = req.session.key['id'];
            UserModels.userDb.update({
                active: false,
            },{
                where: {
                    id: userId,
                },
                returns: true,
            }).then((data) => {
                if (data[0] > 0) {
                    delete req.session.key;
                    return res.status(200).json({
                        message: 'Successfully deleted user.',
                    });
                } else {
                    return res.status(400).json({
                        message: errorMsg,
                        error: err.message,
                    });
                }
            }).catch((err) => {
                logger.error(errorMsg, err, err.message);
                return res.status(400).json({
                    message: errorMsg,
                    error: err.message,
                });
            });
        } else {
            return res.status(401).json({
                message: 'User not authenticated.'
            })
        }
    }

    validateUser(req: $Request, res: $Response): void {
        const { body } = req;
        const username : string = body.username;
        let errorMsg : string = 'User already exists.';

        checkUserNameExists(username).then((data) => {
            if (!!data) {
                return res.status(400).json({
                    message: errorMsg,
                    error: err.message,
                });
            } else {
                return res.status(200).json({
                    message: 'Username available.',
                });
            }
        }).catch((err) => {
            logger.error(errorMsg, err, err.message);
            return res.status(400).json({
                message: errorMsg,
                error: err.message,
            });
        });

    }

    createUser(req: $Request, res: $Response): void {
        const { body } = req;
        const params : CreateUserParams = {
            username: body.username,
            password: body.password,
            email: body.email,
        };
        let errorMsg : string = 'User already exists';

        checkUserNameExists(params.username).then((data) => {
            if (!!data) {
                return res.status(400).json({
                    message: errorMsg,
                    error: err.message,
                });
            } else {
                errorMsg = 'Failed to create user.';

                UserModels.userDb.create({
                    user_name: params.username,
                    password: params.password,
                    email: params.email,
                    active: true,
                }).then((data) => {
                    return res.status(200).json({
                        message: 'User created.',
                    });
                }).catch((err) => {
                    logger.error(errorMsg, err, err.message);
                    return res.status(400).json({
                        message: errorMsg,
                        error: err.message,
                    });
                })
            }
        }).catch((err) => {
            logger.error(errorMsg, err, err.message);
            return res.status(400).json({
                message: errorMsg,
                error: err.message,
            });
        })
    }

}

function checkUserNameExists (username : string) {
    return UserModels.userDb.findOne({
        where: {
            user_name: username,
            active: true,
        }
    });
}
